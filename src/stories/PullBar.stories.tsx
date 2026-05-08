import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PullBar from "../app/(main)/discover/components/PullBar";

const meta = {
  title: "Discover/PullBar",
  component: PullBar,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100vh", background: "#e0dfdd" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PullBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MedState: Story = {};
