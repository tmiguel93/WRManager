import { z } from "zod";

import { MANAGER_PROFILE_CODES } from "@/config/manager-profiles";

const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "Use country ISO code, e.g. US, BR, GB.");

export const careerModeSchema = z.enum(["TEAM_PRINCIPAL", "MY_TEAM", "GLOBAL"]);
export const managerProfileCodeSchema = z.enum(MANAGER_PROFILE_CODES);

export const createCareerSchema = z
  .object({
    careerName: z.string().trim().min(3, "Career name is too short.").max(42),
    mode: careerModeSchema,
    managerProfileCode: managerProfileCodeSchema,
    categoryId: z.string().min(1, "Select a category."),
    selectedTeamId: z.string().optional(),
    myTeamName: z.string().optional(),
    myTeamShortName: z.string().optional(),
    myTeamCountryCode: z.string().optional(),
    myTeamPrimaryColor: z.string().optional(),
    myTeamSecondaryColor: z.string().optional(),
    myTeamAccentColor: z.string().optional(),
    myTeamHeadquarters: z.string().optional(),
    myTeamPhilosophy: z.string().optional(),
    startingSupplierId: z.string().optional(),
    requestedBudget: z.number().min(3_000_000).max(220_000_000).optional(),
  })
  .superRefine((value, context) => {
    if (value.mode === "TEAM_PRINCIPAL" && !value.selectedTeamId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedTeamId"],
        message: "Choose an existing team.",
      });
    }

    if (value.mode === "MY_TEAM") {
      if (!value.myTeamName || value.myTeamName.trim().length < 3) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["myTeamName"],
          message: "My Team name must have at least 3 characters.",
        });
      }
      if (!value.myTeamShortName || value.myTeamShortName.trim().length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["myTeamShortName"],
          message: "Short name is required.",
        });
      }
      if (!value.myTeamCountryCode || !countryCodeSchema.safeParse(value.myTeamCountryCode).success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["myTeamCountryCode"],
          message: "Use a valid ISO country code.",
        });
      }
      if (!value.myTeamHeadquarters || value.myTeamHeadquarters.trim().length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["myTeamHeadquarters"],
          message: "Headquarters is required.",
        });
      }
      if (!value.myTeamPhilosophy || value.myTeamPhilosophy.trim().length < 8) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["myTeamPhilosophy"],
          message: "Add a clear team philosophy.",
        });
      }
      if (!value.startingSupplierId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startingSupplierId"],
          message: "Choose a starting power unit supplier.",
        });
      }
    }
  });

export type CreateCareerInput = z.infer<typeof createCareerSchema>;
