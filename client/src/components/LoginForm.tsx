import { Form } from "@/components/ui/form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { navigate } from "astro:transitions/client";

export default function LoginForm() {
  const [isError, setIsError] = useState(false);
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: e.currentTarget.password.value }),
    });
    if (res.status === 200) {
      setIsError(false);
      navigate("/");
    } else {
      setIsError(true);
    }
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
      {isError && (
        <p className="text-destructive-foreground text-xs">
          Contraseña incorrecta
        </p>
      )}
      <Button type="submit">Acceder</Button>
    </Form>
  );
}
