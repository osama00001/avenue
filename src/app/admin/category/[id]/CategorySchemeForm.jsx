"use client";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { FiTrash2 } from "react-icons/fi";
import ToggleSwitch from "@/components/custom/ToggleSwitch";

const CategorySchemeSchema = Yup.object().shape({
  headingText: Yup.string().trim().required("Heading is required"),
  status: Yup.boolean(),
});

const CategorySchemeForm = ({
  initialData,
  onSubmit,
  onDelete,
  loading = false,
}) => {
  return (
    <Formik
      enableReinitialize
      initialValues={{
        code: initialData?.code || "",
        scheme: initialData?.scheme?.scheme || "",
        headingText: initialData?.scheme?.headingText || "",
        status: initialData?.scheme?.status ?? true,
      }}
      validationSchema={CategorySchemeSchema}
      onSubmit={(values) => {
        onSubmit({
          scheme: values.scheme,
          headingText: values.headingText,
          status: values.status,
        });
      }}
    >
      {({ values, errors, touched, setFieldValue }) => (
        <Form className="bg-white border rounded-xl p-6 space-y-6 max-w-xl w-full shadow-sm">
          {/* READ-ONLY IDENTIFIERS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Category Code</label>
              <input
                value={values.code}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Scheme</label>
              <input
                value={values.scheme}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100 text-sm"
              />
            </div>
          </div>

          {/* EDITABLE HEADING */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Heading Text
            </label>
            <Field
              name="headingText"
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Enter heading text"
            />
            {errors.headingText && touched.headingText && (
              <p className="text-red-500 text-xs mt-1">{errors.headingText}</p>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between pt-4 border-t">
            {/* STATUS */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Status</span>
              <ToggleSwitch
                checked={values.status}
                onChange={() => setFieldValue("status", !values.status)}
              />
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onDelete}
                className="text-red-600 cursor-pointer hover:text-red-800"
                title="Delete scheme"
              >
                <FiTrash2 size={20} />
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2  rounded bg-teal-600 text-white text-sm cursor-pointer font-medium hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default CategorySchemeForm;
