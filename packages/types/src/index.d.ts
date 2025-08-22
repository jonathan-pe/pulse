import { z } from 'zod';
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type User = z.infer<typeof userSchema>;
export declare const typesVersion: 1;
//# sourceMappingURL=index.d.ts.map