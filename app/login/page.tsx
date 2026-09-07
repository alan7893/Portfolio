import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getI18n } from "@/lib/i18n.server";
import { LoginForm } from "@/components/LoginForm";
import { LangSwitcher } from "@/components/LangSwitcher";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }
  const { locale, t } = await getI18n();

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <LangSwitcher locale={locale} />
        </div>
        <div className="card animate-rise p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-xl text-white">
              ✦
            </span>
            <div>
              <h1 className="text-xl font-bold text-ink-900">{t.appName}</h1>
              <p className="text-xs text-ink-700/70">{t.appTagline}</p>
            </div>
          </div>
          <h2 className="mb-1 text-lg font-semibold text-ink-900">
            {t.auth.signInTitle}
          </h2>
          <p className="mb-5 text-sm text-ink-700/70">
            {t.auth.signInSubtitle}
          </p>
          <LoginForm
            labels={{
              email: t.auth.email,
              password: t.auth.password,
              signIn: t.auth.signIn,
              signingIn: t.auth.signingIn,
              invalid: t.auth.invalid,
              rateLimited: t.auth.rateLimited,
            }}
          />
        </div>
      </div>
    </div>
  );
}
