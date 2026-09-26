import { z } from "zod";

export const participantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian phone number starting with 6-9"),
  college: z.string().min(3, "College name must be at least 3 characters"),
  department: z.string().min(2, "Department/Branch name is required"),
  year: z.string().refine(val => ["1", "2", "3", "4"].includes(val), {
    message: "Select a valid year of study",
  }),
});

export const teamMemberSchema = z.object({
  name: z.string().min(2, "Member name is required"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit phone number"),
});

export const registrationSchema = z
  .object({
    registrationType: z.enum(["festival-only", "event-only", "combined"]),
    eventSlug: z.string().optional(),
    primaryParticipant: participantSchema,
    teamName: z.string().optional(),
    teamMembers: z.array(teamMemberSchema).default([]),
    turnstileToken: z.string().optional(),
  })
  .refine(
    (data) => {
      // If registrationType is event-only or combined, eventSlug is required
      if (data.registrationType !== "festival-only" && !data.eventSlug) {
        return false;
      }
      return true;
    },
    {
      message: "Please select an event for registration",
      path: ["eventSlug"],
    }
  );

export type ParticipantFormValues = z.infer<typeof participantSchema>;
export type TeamMemberFormValues = z.infer<typeof teamMemberSchema>;
export type RegistrationFormValues = z.infer<typeof registrationSchema>;
