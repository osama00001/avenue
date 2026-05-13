"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchAddresses,
  deleteAddress,
  setDefaultAddress,
} from "@/store/addressSlice";
import AddAddressForm from "@/components/forms/AddAddressForm";
import { fetchUserDetails } from "@/store/userSlice";

// ================= ADDRESS CARD =================

const AddressCard = ({ addr, onDelete, onDefault }) => (
  <div className="border rounded-xl p-4 bg-white shadow-sm flex justify-between">
    <div>
      <div className="font-semibold text-lg">
        {addr.label}
        {addr.isDefault && (
          <span className="ml-2 text-xs bg-teal-600 text-white px-2 py-1 rounded">
            Default
          </span>
        )}
      </div>

      <div className="text-gray-700">{addr.name}</div>

      <div className="text-gray-600 text-sm">
        {addr.line1} {addr.line2}
        <br />
        {addr.city}, {addr.state}
        <br />
        {addr.postalCode}, {addr.country}
        <br />
        📞 {addr.phone}
      </div>
    </div>

    <div className="flex flex-col gap-2 items-end">
      {!addr.isDefault && (
        <button
          onClick={() => onDefault(addr._id)}
          className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
        >
          Make Default
        </button>
      )}

      <button
        onClick={() => onDelete(addr._id)}
        className="text-sm px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  </div>
);

// ================= PAGE =================

const AddressPage = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.user);
  const { list, loading } = useSelector((s) => s.address);


  console.log("-=-= user address in the user details -=-=-=",user);

  // fetch user + addresses
  useEffect(() => {
    dispatch(fetchUserDetails());
  }, [dispatch]);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchAddresses(user._id));
    }
  }, [user, dispatch]);

  const handleDelete = (id) => {
    dispatch(deleteAddress(id));
  };

  const handleDefault = (id) => {
    dispatch(setDefaultAddress(id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Your Addresses</h1>
          <p className="text-gray-500">Manage shipping destinations</p>
        </div>

        {/* Address List */}
        <div className="space-y-4">
          {loading && <div>Loading...</div>}

          {!loading && list.length === 0 && (
            <div className="text-gray-500">No saved addresses yet</div>
          )}

          {list.map((addr) => (
            <AddressCard
              key={addr._id}
              addr={addr}
              onDelete={handleDelete}
              onDefault={handleDefault}
            />
          ))}
        </div>

        {/* Add Address */}
        {user?._id && (
          <AddAddressForm
            userId={user._id}
            onSuccess={() => dispatch(fetchAddresses(user._id))}
          />
        )}
      </div>
    </div>
  );
};

export default AddressPage;
