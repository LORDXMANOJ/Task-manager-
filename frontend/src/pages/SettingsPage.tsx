import { zodResolver } from "@hookform/resolvers/zod";
import { Laptop, Moon, Sun } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert } from "../components/ui/Alert";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Input, PasswordInput } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import { useTheme, type ThemePreference } from "../context/ThemeContext";
import { userService } from "../services/user.service";
import { cn } from "../utils/cn";
import { getErrorMessage, getFieldErrors } from "../utils/errors";
import { changePasswordSchema, profileSchema, type ChangePasswordValues, type ProfileValues } from "../utils/validation";

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-zinc-200/80 py-8 first:pt-0 last:border-0 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10 dark:border-zinc-800">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <div className="min-w-0 rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </div>
    </section>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name ?? "" } });

  const onSubmit = handleSubmit(async ({ name }) => {
    try {
      const updated = await userService.updateProfile(name);
      setUser(updated);
      reset({ name: updated.name });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't update your profile"));
    }
  });

  if (!user) return null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} className="h-14 w-14 text-base" />
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
      <Input id="profile-name" label="Name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <Input id="profile-email" label="Email" value={user.email} disabled readOnly hint="Your email is used to log in and can't be changed." />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { replaceToken } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const token = await userService.changePassword(values.currentPassword, values.newPassword, values.confirmPassword);
      replaceToken(token);
      reset();
      toast.success("Password changed. Other devices have been signed out.");
    } catch (error) {
      const fields = getFieldErrors(error);
      if (fields.currentPassword) setError("currentPassword", { message: fields.currentPassword });
      else if (fields.newPassword) setError("newPassword", { message: fields.newPassword });
      else toast.error(getErrorMessage(error, "Couldn't change your password"));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <PasswordInput id="current-password" label="Current password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
      <PasswordInput
        id="new-password"
        label="New password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <PasswordInput id="confirm-new-password" label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

function ThemePicker() {
  const { preference, setPreference } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference(value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-all",
              selected
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function DeleteAccount() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    if (!password) return setError("Password is required");
    setLoading(true);
    setError(null);
    try {
      await userService.deleteAccount(password);
      toast.success("Your account has been deleted");
      await logout();
    } catch (err) {
      setError(getFieldErrors(err).password ?? getErrorMessage(err));
      setLoading(false);
    }
  };

  const close = () => {
    setOpen(false);
    setPassword("");
    setError(null);
  };

  return (
    <>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Permanently delete your account and all of your tasks. This cannot be undone.
      </p>
      <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <Modal
        open={open}
        onClose={close}
        dismissible={!loading}
        size="sm"
        title="Delete your account?"
        description="All of your tasks will be permanently deleted."
        footer={
          <>
            <Button variant="outline" onClick={close} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirm} loading={loading}>
              {loading ? "Deleting..." : "Delete my account"}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
          className="space-y-4"
        >
          <Alert>This action is permanent and cannot be undone.</Alert>
          <PasswordInput
            id="delete-password"
            label="Enter your password to confirm"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
          />
        </form>
      </Modal>
    </>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, security and preferences." showCreate={false} />
      <Section title="Profile" description="Your personal information.">
        <ProfileForm />
      </Section>
      <Section title="Password" description="Changing your password signs you out on all other devices.">
        <PasswordForm />
      </Section>
      <Section title="Appearance" description="Choose how TaskFlow looks. Saved on this device.">
        <ThemePicker />
      </Section>
      <Section title="Danger zone" description="Irreversible account actions.">
        <DeleteAccount />
      </Section>
    </>
  );
}
