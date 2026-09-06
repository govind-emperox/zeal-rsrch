import { z } from "zod";

export const EntityIdSchema = z.uuid();
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });
export const StorageKeySchema = z
  .string()
  .min(1)
  .max(1024)
  .refine((value) => !value.startsWith("/"), "Storage keys must be relative")
  .refine((value) => !value.includes("\\"), "Storage keys must use forward slashes")
  .refine(
    (value) => value.split("/").every((segment) => segment !== "" && segment !== "." && segment !== ".."),
    "Storage keys must contain safe, non-empty segments",
  );

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

export const BoundedMetadataSchema = z.record(z.string().max(100), JsonValueSchema).superRefine(
  (value, context) => {
    if (Object.keys(value).length > 50) {
      context.addIssue({
        code: "custom",
        message: "Metadata cannot contain more than 50 keys",
      });
    }

    if (JSON.stringify(value).length > 16_384) {
      context.addIssue({
        code: "custom",
        message: "Metadata cannot exceed 16 KiB",
      });
    }
  },
);

export const PaginationSchema = z.object({
  cursor: z.string().min(1).max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1).max(100),
    message: z.string().min(1).max(1_000),
    issues: z
      .array(
        z.object({
          path: z.string().max(500),
          message: z.string().max(1_000),
        }),
      )
      .max(100)
      .optional(),
  }),
});

export type BoundedMetadata = z.infer<typeof BoundedMetadataSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
