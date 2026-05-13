import Link from "next/link";

export default function NewCustomerCard() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-3">
        New Customers
      </h2>

      <p className="text-gray-600 mb-6 leading-relaxed">
        Creating an account has many benefits: check out faster, keep more than
        one address, track orders and more.
      </p>

      <Link
        href="/auth/user/register"
        className="inline-block bg-[#FF6A00] hover:bg-[#da5f07] text-white font-medium px-6 py-3 rounded-md transition"
      >
        Create an Account
      </Link>
    </div>
  );
}
