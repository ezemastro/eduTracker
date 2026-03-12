/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ADMIN_PASSWORD?: string;
  readonly SECURE_COOKIES?: string;
  readonly PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    isLoggedIn: boolean;
  }
}
