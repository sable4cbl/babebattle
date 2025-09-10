import React, { useState } from "react";
import { BabeCard } from "../types/cards";
import { TextInput, NumberInput } from "./ui/Inputs";

export default function AddBabeForm({ onAdd }: { onAdd: (b: Partial<BabeCard>) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Any");
  const [baseScore, setBaseScore] = useState(1);
  const [img, setImg] = useState("");

  return (
    <div className="grid grid-cols-2 gap-2 items-end">
      <div className="col-span-2">
        <TextInput value={name} onChange={setName} placeholder="Name" />
      </div>
      <div>
        <TextInput value={type} onChange={setType} placeholder="Type (e.g., Pop)" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Base</span>
        <NumberInput value={baseScore} onChange={setBaseScore} min={0} />
      </div>
      <div className="col-span-2">
        <TextInput value={img} onChange={setImg} placeholder="Image/GIF URL (optional)" />
      </div>
      <div className="col-span-2">
        <button
          className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-100 w-full"
          onClick={() => {
            onAdd({ name: name || "New Babe", type, baseScore, img });
            setName("");
            setType("Any");
            setBaseScore(1);
            setImg("");
          }}
        >
          Add Babe
        </button>
      </div>
    </div>
  );
}
