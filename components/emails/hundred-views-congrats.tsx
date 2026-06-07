import {
  Body,
  Head,
  Html,
  Link,
  Tailwind,
  Text,
} from "@react-email/components";

interface HundredViewsCongratsEmailProps {
  name: string | null | undefined;
}

const HundredViewsCongratsEmail = ({
  name,
}: HundredViewsCongratsEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="font-sans text-sm">
          <Text>Hi{name && ` ${name}`},</Text>
          <Text>
            From the Hanzo Dataroom team — congrats on 100 views on your
            documents.
          </Text>
          <Text>
            Thanks so much,
            <br />
            The Hanzo Dataroom Team
          </Text>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default HundredViewsCongratsEmail;
