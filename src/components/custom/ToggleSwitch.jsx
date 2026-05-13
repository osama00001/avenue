"use client";

import * as Switch from "@radix-ui/react-switch";

const ToggleSwitch = ({ checked, onChange }) => {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      className="
        relative w-10 h-5 rounded-full
        bg-gray-300 data-[state=checked]:bg-green-500
        transition-colors outline-none cursor-pointer
      "
    >
      <Switch.Thumb
        className="
          block w-4 h-4 bg-white rounded-full
          translate-x-0.5 data-[state=checked]:translate-x-5
          transition-transform
        "
      />
    </Switch.Root>
  );
};

export default ToggleSwitch;
