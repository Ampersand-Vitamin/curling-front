import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LanguageTag from "../app/(main)/discover/components/LanguageTag";

const meta = {
  title: "Discover/LanguageTag",
  component: LanguageTag,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    language: {
      control: "radio",
      options: ["korean", "english"],
    },
  },
} satisfies Meta<typeof LanguageTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Korean: Story = {
  args: { language: "korean" },
};

export const English: Story = {
  args: { language: "english" },
};
