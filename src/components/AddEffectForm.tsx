import React, { useState } from "react";
import { BabeType, EffectCard, EffectKind } from "../types/cards";
import { TextInput, NumberInput } from "./ui/Inputs";

export default function AddEffectForm({ onAdd }: { onAdd: (e: Partial<EffectCard>) => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<EffectKind>("add-final");
  const [description, setDescription] = useState("");
  const [factor, setFactor] = useState<number>(2);
  const [add, setAdd] = useState<number>(5);
  const [targetType, setTargetType] = useState<string>("");
  const [extraBabes, setExtraBabes] = useState<number>(1);
  const [extraEffects, setExtraEffects] = useState<number>(1);

  return (
    <div className="grid grid-cols-2 gap-2 items-end">
      <div className="col-span-2">
        <TextInput value={name} onChange={setName} placeholder="Effect name" />
      </div>
      <div className="col-span-2">
        <select
          className="border rounded-lg px-2 py-1 text-sm w-full"
          value={kind}
          onChange={(e) => setKind(e.target.value as EffectKind)}
        >
          <option value="multiply-babe">multiply-babe</option>
          <option value="multiply-type">multiply-type</option>
          <option value="multiply-all">multiply-all</option>
          <option value="add-final">add-final</option>
          <option value="multiply-final">multiply-final</option>
          <option value="extra-plays">extra-plays</option>
          <option value="discard-babes-add-final">discard-babes-add-final</option>
        </select>
      </div>
      <div className="col-span-2">
        <TextInput
          value={description}
          onChange={setDescription}
          placeholder="Short description (optional)"
        />
      </div>

      {(kind === "multiply-babe" ||
        kind === "multiply-type" ||
        kind === "multiply-all" ||
        kind === "multiply-final") && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Factor</span>
          <NumberInput value={factor} onChange={setFactor} step={0.1} />
        </div>
      )}
      {kind === "add-final" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Add</span>
          <NumberInput value={add} onChange={setAdd} />
        </div>
      )}
      {kind === "multiply-type" && (
        <div>
          <TextInput
            value={targetType}
            onChange={setTargetType}
            placeholder="Target Type (e.g., Pop)"
          />
        </div>
      )}
      {kind === "extra-plays" && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">+Babes</span>
            <NumberInput value={extraBabes} onChange={setExtraBabes} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">+Effects</span>
            <NumberInput value={extraEffects} onChange={setExtraEffects} />
          </div>
        </>
      )}

      <div className="col-span-2">
        <button
          className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-100 w-full"
          onClick={() => {
            onAdd({
              name: name || kind,
              kind,
              description: description || undefined,
              factor:
                ["multiply-babe", "multiply-type", "multiply-all", "multiply-final"].includes(kind)
                  ? factor
                  : undefined,
              add: kind === "add-final" ? add : undefined,
              targetType:
                kind === "multiply-type" && targetType ? (targetType as BabeType) : undefined,
              extraBabes: kind === "extra-plays" ? extraBabes : undefined,
              extraEffects: kind === "extra-plays" ? extraEffects : undefined,
              // no priority any more
            });
            setName("");
            setDescription("");
            setFactor(2);
            setAdd(5);
            setTargetType("");
          }}
        >
          Add Effect
        </button>
      </div>
    </div>
  );
}
