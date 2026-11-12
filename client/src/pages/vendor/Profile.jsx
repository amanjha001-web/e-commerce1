import { useState } from "react";
import { toast } from "sonner";

const INITIAL_FIELDS = [
  ["Shop name", "Northstar Store"],
  ["Shop slug", "northstar-store"],
  ["Business email", "northstar@email.com"],
  ["Phone", "9876543210"],
  ["GSTIN", "09ABCDE1234F1Z5"],
  ["Business address", "Delhi, India"],
];

const Profile = () => {
  const [values, setValues] = useState(() =>
    Object.fromEntries(INITIAL_FIELDS),
  );

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1>Shop profile</h1>
        </div>
      </div>

      <div className="panel">
        <h2>Shop information</h2>
        <div className="formgrid">
          {INITIAL_FIELDS.map(([label]) => (
            <div key={label} className="formgroup">
              <label>{label}</label>
              <input
                className="field full"
                value={values[label] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [label]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="primarybtn"
          style={{ marginTop: "18px" }}
          onClick={() => toast.success("Shop profile saved")}
        >
          Save profile
        </button>
      </div>
    </div>
  );
};

export default Profile;
