import { useState } from "react";

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [newAddr, setNewAddr] = useState("");

 const addAddress = () => {
  if (!newAddr.trim()) return;

  setAddresses([...addresses, newAddr.trim()]);
  setNewAddr("");
};

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl mb-4">Saved Addresses</h2>

      {addresses.map((a, i) => (
        <div key={i} className="bg-gray-800 p-3 mb-2 rounded">{a}</div>
      ))}

      <textarea
        value={newAddr}
        onChange={(e) => setNewAddr(e.target.value)}
        className="w-full p-2 text-black"
      />

      <button onClick={addAddress} className="mt-2 bg-red-600 px-4 py-2 rounded">
        Add Address
      </button>
    </div>
  );
}
