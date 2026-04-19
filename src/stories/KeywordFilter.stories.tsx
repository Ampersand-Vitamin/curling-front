import type { Meta, StoryFn, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import KeywordFilter from "../app/(main)/discover/components/KeywordFilter";

const meta = {
  title: "Discover/KeywordFilter",
  component: KeywordFilter,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    activated: { control: "boolean" },
    label: { control: "text" },
    showChevron: { control: "boolean" },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof KeywordFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "English Available", activated: false },
};

export const Activated: Story = {
  args: { label: "English Available", activated: true },
};

export const AllFilters: { render: StoryFn } = {
  render: () => {
    const filters = ["English Available", "Experience with Curly Hair", "Foreigner Friendly"];
    return (
      <div style={{ display: "flex", gap: "8px" }}>
        {filters.map((label) => (
          <KeywordFilter key={label} label={label} />
        ))}
      </div>
    );
  },
};
