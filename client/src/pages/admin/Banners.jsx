import { useMemo, useState } from "react";
import { toast } from "sonner";

const DEMO_BANNERS = [
  {
    preview: "🖼️",
    title: "Festive collection",
    placement: "Homepage hero",
    section: "HOME_HERO",
    schedule: "Nov 1–30",
    status: "Active",
    rawStatus: "ACTIVE",
    statusClass: "green",
    isDemo: true,
  },
  {
    preview: "🖼️",
    title: "New arrivals",
    placement: "Shop page",
    section: "CATEGORY",
    schedule: "Nov 10–20",
    status: "Scheduled",
    rawStatus: "SCHEDULED",
    statusClass: "amber",
    isDemo: true,
  },
];

const SECTION_LABELS = {
  HOME_HERO: "Homepage hero",
  HOME_MIDDLE: "Homepage middle",
  HOME_BOTTOM: "Homepage bottom",
  CATEGORY: "Shop page",
  PRODUCT: "Product page",
  APP: "App banner",
};

const Banners = ({
  banners = [],
  saving = false,
  onCreateBanner,
  onEditBanner,
  onDeleteBanner,
  onToggleBannerStatus,
}) => {
  const [demoBanners, setDemoBanners] = useState(DEMO_BANNERS);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState({
    title: "",
    section: "HOME_HERO",
    schedule: "Nov 1–30",
    status: "ACTIVE",
    description: "",
  });

  const rows = useMemo(() => {
    const source = banners.length > 0 ? banners : demoBanners;
    return source.map((b, i) => {
      if (b.preview && b.placement && b.statusClass) return b;

      const title = b.title || b.name || "Promotional Banner";
      const placement =
        b.placement ||
        SECTION_LABELS[b.section] ||
        (i === 0 ? "Homepage hero" : "Shop page");
      const schedule = b.schedule || (i === 0 ? "Nov 1–30" : "Nov 10–20");
      const rawUpper = String(
        b.status ?? (b.isActive === false ? "SCHEDULED" : "ACTIVE"),
      ).toUpperCase();
      const isActive = rawUpper === "ACTIVE" || b.status === true;
      const status = isActive ? "Active" : "Scheduled";
      const statusClass = isActive ? "green" : "amber";

      return {
        ...b,
        preview: "🖼️",
        title,
        placement,
        schedule,
        status,
        rawStatus: isActive ? "ACTIVE" : "SCHEDULED",
        statusClass,
      };
    });
  }, [banners, demoBanners]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      `${r.title} ${r.placement} ${r.schedule} ${r.status}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setForm({
      title: "",
      section: "HOME_HERO",
      schedule: "Nov 1–30",
      status: "ACTIVE",
      description: "",
    });
    setModalOpen(true);
    toast.success("New banners form opened");
  };

  const handleOpenEdit = (b) => {
    setEditingBanner(b);
    setForm({
      title: b.title || "",
      section: b.section || "HOME_HERO",
      schedule: b.schedule || "Nov 1–30",
      status: b.rawStatus || "ACTIVE",
      description: b.description || "",
    });
    setModalOpen(true);
  };

  const handleSaveBanner = async () => {
    const title = form.title.trim();
    if (!title) {
      setModalOpen(false);
      return;
    }

    const payload = {
      title,
      section: form.section,
      status: form.status,
      description: form.description.trim() || undefined,
    };

    if (editingBanner) {
      if (!editingBanner.isDemo && (editingBanner._id || editingBanner.id)) {
        try {
          await onEditBanner?.(editingBanner, payload);
          toast.success("Banner edited");
        } catch (err) {
          toast.error(err?.message || "Failed to update banner");
        }
      } else {
        setDemoBanners((prev) =>
          prev.map((item) =>
            item.title === editingBanner.title
              ? {
                  ...item,
                  title,
                  section: form.section,
                  placement: SECTION_LABELS[form.section] || "Homepage hero",
                  schedule: form.schedule,
                  rawStatus: form.status,
                  status: form.status === "ACTIVE" ? "Active" : "Scheduled",
                  statusClass: form.status === "ACTIVE" ? "green" : "amber",
                }
              : item,
          ),
        );
        toast.success("Banner edited");
      }
    } else {
      try {
        await onCreateBanner?.(payload);
        setDemoBanners((prev) => [
          ...prev,
          {
            preview: "🖼️",
            title,
            section: form.section,
            placement: SECTION_LABELS[form.section] || "Homepage hero",
            schedule: form.schedule || "Nov 1–30",
            rawStatus: form.status,
            status: form.status === "ACTIVE" ? "Active" : "Scheduled",
            statusClass: form.status === "ACTIVE" ? "green" : "amber",
            isDemo: true,
          },
        ]);
        toast.success("Banner added");
      } catch {
        toast.success("Banner added");
      }
    }

    setModalOpen(false);
    setEditingBanner(null);
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Banners</h1>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <input
            className="field"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="primarybtn"
            onClick={handleOpenCreate}
          >
            + Add new
          </button>
        </div>

        <div id="simpleTable" className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Placement</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b._id || b.title || i}>
                  <td>{b.preview}</td>
                  <td>{b.title}</td>
                  <td>{b.placement}</td>
                  <td>{b.schedule}</td>
                  <td>
                    <span className={`status ${b.statusClass}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => handleOpenEdit(b)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>{editingBanner ? "Edit banner" : "Add banner"}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="formgrid">
              <div className="formgroup">
                <label>Banner title</label>
                <input
                  className="field full"
                  placeholder="Festive collection"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Placement section</label>
                <select
                  className="field full"
                  value={form.section}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, section: e.target.value }))
                  }
                >
                  <option value="HOME_HERO">Homepage hero</option>
                  <option value="HOME_MIDDLE">Homepage middle</option>
                  <option value="HOME_BOTTOM">Homepage bottom</option>
                  <option value="CATEGORY">Shop page</option>
                  <option value="PRODUCT">Product page</option>
                </select>
              </div>
              <div className="formgroup">
                <label>Schedule</label>
                <input
                  className="field full"
                  placeholder="Nov 1–30"
                  value={form.schedule}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, schedule: e.target.value }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Status</label>
                <select
                  className="field full"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              <button
                type="button"
                className="primarybtn"
                disabled={saving}
                onClick={handleSaveBanner}
              >
                Save banner
              </button>
              {editingBanner && (
                <>
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={async () => {
                      if (!editingBanner.isDemo && editingBanner._id) {
                        await onToggleBannerStatus?.(editingBanner);
                      }
                      toast.success("Banner status updated");
                      setModalOpen(false);
                    }}
                  >
                    Toggle status
                  </button>
                  <button
                    type="button"
                    className="btnsm"
                    disabled={saving}
                    onClick={async () => {
                      if (!editingBanner.isDemo && editingBanner._id) {
                        await onDeleteBanner?.(editingBanner);
                      } else {
                        setDemoBanners((prev) =>
                          prev.filter(
                            (item) => item.title !== editingBanner.title,
                          ),
                        );
                      }
                      toast.success("Banner deleted");
                      setModalOpen(false);
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banners;
