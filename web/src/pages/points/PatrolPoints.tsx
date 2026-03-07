import { useState } from "react";
import { Layout } from "../../components/Layout";
import { Plus, Search, MapPin, Printer, X, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

export default function PatrolPoints() {
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSiteId, setSelectedSiteId] = useState<string>("all");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newSiteId, setNewSiteId] = useState<string>("");
    const [newLat, setNewLat] = useState("");
    const [newLng, setNewLng] = useState("");
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [isDetecting, setIsDetecting] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState<Id<"patrolPoints"> | null>(null);

    const currentUser = useQuery(api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );
    const organizationId = currentUser?.organizationId;
    const orgs = useQuery(api.organizations.list);

    const sites = useQuery(api.sites.listSitesByOrg,
        (organizationId || (selectedOrgId as Id<"organizations">)) ? { organizationId: (organizationId || selectedOrgId) as Id<"organizations"> } : "skip"
    );
    const allPoints = useQuery(api.patrolPoints.listByOrg,
        (organizationId || (selectedOrgId as Id<"organizations">)) ? { organizationId: (organizationId || selectedOrgId) as Id<"organizations"> } : "skip"
    );

    const createPoint = useMutation(api.patrolPoints.createPoint);
    const deletePoint = useMutation(api.patrolPoints.removePoint);

    const handleAddPoint = async () => {
        const orgIdToUse = organizationId || selectedOrgId;
        if (!newName || !newSiteId || !orgIdToUse || !newLat || !newLng) {
            toast.error("Please fill in all fields (including coordinates)");
            return;
        }

        try {
            await createPoint({
                name: newName,
                siteId: newSiteId as Id<"sites">,
                latitude: parseFloat(newLat),
                longitude: parseFloat(newLng),
                organizationId: orgIdToUse as Id<"organizations">,
            });
            setIsAddModalOpen(false);
            setNewName("");
            setNewSiteId("");
            setNewLat("");
            setNewLng("");
            toast.success("Patrol point created successfully");
        } catch (error) {
            toast.error("Failed to create patrol point");
        }
    };

    const detectLocation = () => {
        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setNewLat(pos.coords.latitude.toString());
                setNewLng(pos.coords.longitude.toString());
                setIsDetecting(false);
                toast.success("Current location captured!");
            },
            (err) => {
                toast.error("Failed to get location: " + err.message);
                setIsDetecting(false);
            }
        );
    };

    const handleDeletePoint = async (id: Id<"patrolPoints">) => {
        try {
            await deletePoint({ id });
            setIsDeletingId(null);
            toast.success("Point deleted successfully");
        } catch (error) {
            toast.error("Failed to delete point");
        }
    };

    const handlePrint = (point: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const qrSvg = document.getElementById(`qr-${point._id}`)?.outerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR - ${point.name}</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                        .container { border: 2px solid #000; padding: 40px; border-radius: 20px; text-align: center; }
                        h1 { margin-top: 20px; font-size: 24px; }
                        p { color: #666; margin-bottom: 30px; }
                        svg { width: 300px; height: 300px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        ${qrSvg}
                        <h1>${sites?.find(s => s._id === point.siteId)?.name}_${point.name}</h1>
                        <p>ID: ${point.qrCode}</p>
                    </div>
                    <script>window.onload = () => { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredPoints = allPoints?.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSite = selectedSiteId === "all" || p.siteId === selectedSiteId;
        return matchesSearch && matchesSite;
    });

    return (
        <Layout title="Patrol QR Points">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search points..."
                                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 w-full"
                            />
                        </div>

                        {!organizationId && (
                            <select
                                value={selectedOrgId}
                                onChange={e => setSelectedOrgId(e.target.value)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-white/70"
                            >
                                <option value="">Select Organization</option>
                                {orgs?.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                            </select>
                        )}

                        <select
                            value={selectedSiteId}
                            onChange={e => setSelectedSiteId(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-white/70"
                        >
                            <option value="all">All Sites</option>
                            {sites?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    >
                        <Plus className="w-4 h-4" />
                        Generate New QR
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPoints === undefined ? (
                        <div className="col-span-full flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : filteredPoints.map((point) => (
                        <div key={point._id} className="glass p-6 rounded-2xl border border-white/10 group hover:border-primary/50 transition-all relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-4 rounded-xl bg-white flex items-center justify-center border border-white/10 overflow-hidden" id={`qr-${point._id}`}>
                                    <QRCodeSVG value={point.qrCode} size={100} level="H" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handlePrint(point)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                                        title="Print QR Code"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsDeletingId(point._id)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                                        title="Delete Point"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h5 className="text-lg font-bold text-white/90">
                                {sites?.find(s => s._id === point.siteId)?.name}_{point.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5" />
                                {sites?.find(s => s._id === point.siteId)?.name || "Loading Site..."}
                            </div>
                            <div className="mt-6 p-3 bg-white/5 rounded-xl border border-dashed border-white/10 text-center">
                                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest break-all">ID: {point.qrCode}</span>
                            </div>
                        </div>
                    ))}
                    {filteredPoints?.length === 0 && (
                        <div className="col-span-full text-center py-20 text-muted-foreground italic">
                            No patrol points found. Click "Generate New QR" to create one.
                        </div>
                    )}
                </div>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 p-4 sm:p-6 space-y-4 custom-scrollbar">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Generate Patrol QR</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Assigned Site</label>
                                <select
                                    value={newSiteId}
                                    onChange={e => setNewSiteId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white"
                                >
                                    <option value="">Select a Site</option>
                                    {sites?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Point Name</label>
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="e.g. Main Transformer, North Gate"
                                    className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block flex justify-between">
                                    Precise GPS Location
                                    <button
                                        onClick={detectLocation}
                                        disabled={isDetecting}
                                        className="text-primary hover:text-primary/80 transition-colors lowercase"
                                    >
                                        {isDetecting ? "Detecting..." : "Detect Current Location"}
                                    </button>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        step="any"
                                        value={newLat}
                                        onChange={e => setNewLat(e.target.value)}
                                        placeholder="Latitude"
                                        className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white text-sm"
                                    />
                                    <input
                                        type="number"
                                        step="any"
                                        value={newLng}
                                        onChange={e => setNewLng(e.target.value)}
                                        placeholder="Longitude"
                                        className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleAddPoint}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg"
                        >
                            Generate Point
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass w-full max-w-sm rounded-2xl border border-white/10 p-6 space-y-4 text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">Delete QR Point?</h3>
                            <p className="text-sm text-muted-foreground">All patrol logs associated with this point will remain, but the point will be removed from the management list.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeletingId(null)} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10">Cancel</button>
                            <button onClick={() => handleDeletePoint(isDeletingId)} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
