import { AppError } from "./app-error";

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 404);
    this.name = "NotFoundError";
  }
}
