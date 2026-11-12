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
          <div className="w-full border-t border-[var(--line)]" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-bold text-[var(--muted)]">
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
          className="outlinebtn w-full py-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-5 w-5 items-center justify-center text-base font-bold text-[var(--primary)]">
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
          className="primarybtn mt-3 w-full py-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
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
          className="outlinebtn mt-3 w-full py-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
            f
          </span>

          <span>Continue with Facebook</span>
        </button>
      )}
    </div>
  );
};

export default SocialLogin;
