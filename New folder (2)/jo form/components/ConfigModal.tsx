"use client";

import React, { useState, useEffect } from "react";
import { InstitutionConfig } from "@/config/institutionConfig";
import { compressImageFile } from "@/lib/imageUtils";
import {
  X,
  Save,
  RotateCcw,
  Building,
  Mail,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Trash2,
} from "lucide-react";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: InstitutionConfig;
  onSave: (updated: InstitutionConfig) => void;
  onReset: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<InstitutionConfig>(config);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setFormData(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleBrochureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file for the brochure (PNG, JPG, or WebP).");
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        setFormData((prev) => ({ ...prev, brochureUrl: base64 }));
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Failed to upload brochure image:", err);
    }
  };

  const handleRemoveBrochure = () => {
    setFormData((prev) => ({ ...prev, brochureUrl: "" }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("sig_")) {
      const sigKey = name.replace("sig_", "") as keyof InstitutionConfig["signatureTitles"];
      setFormData((prev) => ({
        ...prev,
        signatureTitles: {
          ...prev.signatureTitles,
          [sigKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-lg">Institutional Branding & Config</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {savedNotice && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Branding settings updated successfully!</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
              1. Institutional Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  College Name
                </label>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  name="departmentName"
                  value={formData.departmentName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  College Address
                </label>
                <input
                  type="text"
                  name="collegeAddress"
                  value={formData.collegeAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NAAC Accreditation Details
                </label>
                <input
                  type="text"
                  name="naacAccreditation"
                  value={formData.naacAccreditation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1 pt-2">
              2. Destination Office Email & Filename Format
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  Designated Office Email
                </label>
                <input
                  type="email"
                  name="officeEmail"
                  value={formData.officeEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  PDF Filename Pattern
                </label>
                <input
                  type="text"
                  name="pdfFilenameFormat"
                  value={formData.pdfFilenameFormat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1 pt-2">
              3. PDF Signature Box Labels
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Signatory 1
                </label>
                <input
                  type="text"
                  name="sig_coordinator"
                  value={formData.signatureTitles.coordinator}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Signatory 2
                </label>
                <input
                  type="text"
                  name="sig_hod"
                  value={formData.signatureTitles.hod}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Signatory 3
                </label>
                <input
                  type="text"
                  name="sig_principal"
                  value={formData.signatureTitles.principal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1 pt-2 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              4. Event Brochure / Poster Flyer (Optional)
            </h3>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              {formData.brochureUrl ? (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.brochureUrl}
                      alt="Event Brochure Preview"
                      className="w-16 h-16 object-cover rounded-md border border-slate-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Event Brochure Uploaded</p>
                      <p className="text-[11px] text-slate-500">
                        Will be automatically included in all generated NAAC PDF reports.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveBrochure}
                    className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Upload Event Brochure / Flyer</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload an image of the event brochure, poster, or circular.
                    </p>
                  </div>
                  <label className="px-3.5 py-2 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold rounded-lg border border-blue-200 cursor-pointer flex items-center gap-1.5 transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Brochure</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleBrochureUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                Apply Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
