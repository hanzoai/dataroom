import { ERRORS, Lock, Locker, RequestRelease } from "@tus/utils";
import type KV from "@hanzo/kv";

/**
 * KvLocker is an implementation of the Locker interface that manages locks in key-value store using KV.
 * This class is designed for exclusive access control over resources, often used in scenarios like upload management.
 *
 * Key Features:
 * - Ensures exclusive resource access by using a KV-based map to track locks.
 * - Implements timeout for lock acquisition, mitigating deadlock situations.
 * - Facilitates both immediate and graceful release of locks through different mechanisms.
 *
 * Locking Behavior:
 * - When the `lock` method is invoked for an already locked resource, the `cancelReq` callback is called.
 *   This signals to the current lock holder that another process is requesting the lock, encouraging them to release it as soon as possible.
 * - The lock attempt continues until the specified timeout is reached. If the timeout expires and the lock is still not
 *   available, an error is thrown to indicate lock acquisition failure.
 *
 * Lock Acquisition and Release:
 * - The `lock` method implements a wait mechanism, allowing a lock request to either succeed when the lock becomes available,
 *   or fail after the timeout period.
 * - The `unlock` method releases a lock, making the resource available for other requests.
 */

interface KvLockerOptions {
  acquireLockTimeout?: number;
  client: KV;
}

export class KvLocker implements Locker {
  timeout: number;
  client: KV;

  constructor(options: KvLockerOptions) {
    this.timeout = options.acquireLockTimeout ?? 1000 * 30; // default: 30 seconds
    this.client = options.client;
  }

  newLock(id: string) {
    return new KvLock(id, this, this.timeout);
  }
}

class KvLock implements Lock {
  constructor(
    private id: string,
    private locker: KvLocker,
    private timeout: number = 1000 * 30, // default: 30 seconds
  ) {}

  async lock(
    signal: AbortSignal,
    requestRelease: RequestRelease,
  ): Promise<void> {
    const abortController = new AbortController();
    const lock = await Promise.race([
      this.waitTimeout(signal),
      this.acquireLock(this.id, requestRelease, signal),
    ]);

    abortController.abort();

    if (!lock) {
      throw ERRORS.ERR_LOCK_TIMEOUT;
    }
  }

  protected async acquireLock(
    id: string,
    requestRelease: RequestRelease,
    signal: AbortSignal,
  ): Promise<boolean> {
    if (signal.aborted) {
      return false;
    }

    const lockKey = `tus-lock-${id}`;
    // SET key value NX PX timeout
    const lock = await this.locker.client.set(lockKey, "locked", "PX", this.timeout, "NX");

    if (lock === "OK") {
      // Register a release request flag in KV
      await this.locker.client.set(`requestRelease:${lockKey}`, "true", "PX", this.timeout);
      return true;
    }

    // Check if the release was requested
    const releaseRequestStr = await this.locker.client.get(
      `requestRelease:${lockKey}`,
    );
    if (releaseRequestStr === "true") {
      await requestRelease?.();
    }

    await new Promise((resolve, reject) => {
      setImmediate(() => {
        this.acquireLock(id, requestRelease, signal)
          .then(resolve)
          .catch(reject);
      });
    });

    return false;
  }

  async unlock(): Promise<void> {
    const lockKey = `tus-lock-${this.id}`;
    const lockExists = await this.locker.client.del(lockKey);
    if (!lockExists) {
      throw new Error("Releasing an unlocked lock!");
    }

    // Clean up the request release entry
    await this.locker.client.del(`requestRelease:${lockKey}`);
  }

  protected waitTimeout(signal: AbortSignal) {
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, this.timeout);

      const abortListener = () => {
        clearTimeout(timeout);
        signal.removeEventListener("abort", abortListener);
        resolve(false);
      };
      signal.addEventListener("abort", abortListener);
    });
  }
}
