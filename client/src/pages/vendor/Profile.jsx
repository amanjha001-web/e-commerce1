
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchVendorProfile,
  updateVendorProfile,
  clearVendorMessages,
} from "../../store/slices/vendorSlice";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

const EMPTY_PROFILE = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error) => {
  if (typeof error === "string") return error;
  return error?.message || "Something went wrong.";
};

const Profile = () => {
  const dispatch = useDispatch();

  // Authenticated user: update this selector if your auth slice differs.
  const authUser = useSelector(
    (state) => state.auth?.user ?? state.auth?.currentUser ?? null,
  );

  // Vendor profile slice
  const {
    profile,
    loading,
    savingProfile,
    error,
    successMessage,
  } = useSelector((state) => state.vendor);

  // Keep vendor requests in their existing, separate slice.
  // Assumes the reducer is registered as state.vendorRequest.
  const requestState = useSelector((state) => state.vendorRequest);

  const vendorRequest =
    requestState?.myRequest ??
    requestState?.request ??
    requestState?.vendorRequest ??
    requestState?.data ??
    null;

  const requestLoading = Boolean(requestState?.loading);
  const requestError =
    requestState?.error?.message ??
    requestState?.error ??
    null;

  const [profileEdits, setProfileEdits] = useState({});
  const [formError, setFormError] = useState("");

  // A vendor document ID is not necessarily the same as a request ID.
  const vendorId = profile?._id ?? authUser?.vendor?._id ?? null;

  useEffect(() => {
    if (vendorId) {
      dispatch(fetchVendorProfile(vendorId));
    }
  }, [dispatch, vendorId]);

  // Populate defaults from the authenticated account/profile.
  const form = useMemo(
    () => ({
      ...EMPTY_PROFILE,
      fullName:
        profile?.fullName ??
        authUser?.fullName ??
        authUser?.name ??
        "",
      username: profile?.username ?? authUser?.username ?? "",
      email: profile?.email ?? authUser?.email ?? "",
      phone: profile?.phone ?? authUser?.phone ?? "",
      ...profileEdits,
    }),
    [profile, authUser, profileEdits],
  );

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileEdits((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!vendorId) {
      setFormError(
        "Vendor profile ID is unavailable. Please verify your authenticated vendor data.",
      );
      return;
    }

    const result = await dispatch(
      updateVendorProfile({
        vendorId,
        data: {
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          phone: form.phone.trim(),
        },
      }),
    );

    if (updateVendorProfile.fulfilled.match(result)) {
      setProfileEdits({});
      dispatch(fetchVendorProfile(vendorId));
    }
  };

  const status = vendorRequest?.status ?? profile?.status ?? "unknown";

  const documents = Array.isArray(vendorRequest?.documents)
    ? vendorRequest.documents
    : Array.isArray(profile?.documents)
      ? profile.documents
      : [];

  const address = vendorRequest?.address ?? {};
  const bankDetails = vendorRequest?.bankDetails ?? {};

  const field = (label, name, value, onChange, options = {}) => (
    <Input
      label={label}
      name={name}
      value={value ?? ""}
      onChange={onChange}
      placeholder={`Enter ${label.toLowerCase()}`}
      {...options}
    />
  );

  if (loading && !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground">
            Vendor Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account information and view your vendor application
            details.
          </p>
        </header>

        {(formError || error || successMessage || requestError) && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-sm ${
              formError || error || requestError
                ? "border-red-500/30 bg-red-500/10 text-red-600"
                : "border-green-500/30 bg-green-500/10 text-green-600"
            }`}
          >
            {formError ||
              getErrorMessage(error) ||
              getErrorMessage(requestError) ||
              successMessage}

            <button
              type="button"
              className="ml-3 underline"
              onClick={() => {
                setFormError("");
                dispatch(clearVendorMessages());
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Vendor Overview */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-muted-foreground">Vendor Account</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">
                {form.fullName || "Vendor"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {form.email || "No email available"}
              </p>
            </div>

            <span className="w-fit rounded-full bg-muted px-3 py-1.5 text-sm font-medium capitalize text-foreground">
              {String(status).replaceAll("_", " ")}
            </span>
          </div>

          <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Vendor Profile ID
              </p>
              <p className="mt-1 break-all text-sm font-medium text-foreground">
                {vendorId || "Unavailable"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Request Submitted
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formatDate(vendorRequest?.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Reviewed At</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formatDate(vendorRequest?.reviewedAt)}
              </p>
            </div>
          </div>

          {vendorRequest?.reviewedBy?.fullName && (
            <p className="mt-4 text-xs text-muted-foreground">
              Reviewed by {vendorRequest.reviewedBy.fullName}
            </p>
          )}
        </section>

        {/* Personal Information */}
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Personal Information
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your vendor account details.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {field("Full Name", "fullName", form.fullName, handleProfileChange, {
                required: true,
              })}

              {field("Username", "username", form.username, handleProfileChange, {
                required: true,
              })}

              {field("Email", "email", form.email, handleProfileChange, {
                type: "email",
                disabled: true,
              })}

              {field("Phone", "phone", form.phone, handleProfileChange)}
            </div>

            <div className="flex justify-end border-t border-border pt-5">
              <Button type="submit" disabled={savingProfile || !vendorId}>
                {savingProfile ? "Saving..." : "Save Personal Details"}
              </Button>
            </div>
          </form>
        </section>

        {/* Vendor Request / Business Information */}
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Business & Store Details
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Details submitted in your vendor application.
            </p>
          </div>

          {requestLoading ? (
            <div className="flex justify-center p-8">
              <Loader />
            </div>
          ) : (
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              {[
                ["Shop Name", vendorRequest?.shopName],
                ["Business Name", vendorRequest?.businessName],
                ["Business Email", vendorRequest?.email],
                ["Business Phone", vendorRequest?.phone],
                ["Website", vendorRequest?.website],
                ["City", address.city],
                ["Address Line 1", address.addressLine1],
                ["Address Line 2", address.addressLine2],
                ["State", address.state],
                ["Postal Code", address.postalCode],
                ["Country", address.country],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 break-words text-sm font-medium text-foreground">
                    {value || "—"}
                  </p>
                </div>
              ))}

              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Business Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {vendorRequest?.description || "—"}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Bank Details — read-only until an update endpoint exists */}
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Bank & Payout Details
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Bank information submitted with your application.
            </p>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {[
              ["Account Holder Name", bankDetails.accountHolderName],
              ["Account Number", bankDetails.accountNumber],
              ["IFSC Code", bankDetails.ifscCode],
              ["Bank Name", bankDetails.bankName],
              ["Branch Name", bankDetails.branchName],
              ["UPI ID", bankDetails.upiId],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">
                  {label === "Account Number" && value
                    ? `••••${String(value).slice(-4)}`
                    : value || "—"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Verification Documents */}
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Verification Documents
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Documents submitted with your vendor request.
            </p>
          </div>

          <div className="space-y-3 p-6">
            {documents.length ? (
              documents.map((document, index) => (
                <div
                  key={
                    document._id ||
                    document.publicId ||
                    document.url ||
                    `${document.type || "document"}-${index}`
                  }
                  className="flex flex-col justify-between gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-medium capitalize text-foreground">
                      {String(document.type || "Other").replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {document.number
                        ? `Document number: ${document.number}`
                        : "No document number provided"}
                    </p>
                  </div>

                  {document.url ? (
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary underline"
                    >
                      View Document
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No document URL available
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No verification documents found.
              </p>
            )}
          </div>
        </section>

        {/* Account Information */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Account Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="mt-1 text-sm font-medium capitalize text-foreground">
                {profile?.role || authUser?.role || "Vendor"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Vendor Status</p>
              <p className="mt-1 text-sm font-medium capitalize text-foreground">
                {String(status).replaceAll("_", " ")}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Profile Created</p>
              <p className="mt-1 text-sm text-foreground">
                {formatDate(profile?.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="mt-1 text-sm text-foreground">
                {formatDate(profile?.updatedAt)}
              </p>
            </div>
          </div>
        </section>

        {/* Retry failed requests */}
        {(error || requestError) && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (vendorId) {
                  dispatch(fetchVendorProfile(vendorId));
                }
              }}
              disabled={loading || !vendorId}
            >
              Retry Loading
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
