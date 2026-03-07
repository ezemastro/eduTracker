import { Form } from "@/components/ui/form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: e.currentTarget.password.value }),
    });
  };
  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <FieldLabel>Contraseña</FieldLabel>
        <Input
          type="password"
          name="password"
          placeholder="Introduce la contraseña"
          required
        />
        <FieldError>La contraseña es requerida</FieldError>
      </Field>
      <Button type="submit">Acceder</Button>
    </Form>
  );
}
