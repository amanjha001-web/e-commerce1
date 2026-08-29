const SocialLogin = ({
  onGoogleLogin,
  onGithubLogin,
  onFacebookLogin,
  loading = false,
  providers = ["google"],
  dividerText = "OR",
}) => {
  const isProviderEnabled = (provider) => providers.includes(provider);

  return (
    <div className="w-full">
      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium text-gray-400 dark:bg-gray-900">
            {dividerText}
          </span>
        </div>
      </div>

      {/* Google */}
      {isProviderEnabled("google") && (
        <button
          type="button"
          disabled={loading}
          onClick={onGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <span className="flex h-5 w-5 items-center justify-center text-base font-bold">
            G
          </span>

          <span>Continue with Google</span>
        </button>
      )}

      {/* GitHub */}
      {isProviderEnabled("github") && (
        <button
          type="button"
          disabled={loading}
          onClick={onGithubLogin}
          className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          <span className="text-lg">◉</span>

          <span>Continue with GitHub</span>
        </button>
      )}

      {/* Facebook */}
      {isProviderEnabled("facebook") && (
        <button
          type="button"
          disabled={loading}
          onClick={onFacebookLogin}
          className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            f
          </span>

          <span>Continue with Facebook</span>
        </button>
      )}
    </div>
  );
};

export default SocialLogin;
