import type { Meta, StoryFn, StoryObj } from "@storybook/nextjs-vite";
import DesignerCard from "../app/discover/components/DesignerCard";

const SHARED_ARGS = {
  name: "Sejin",
  role: "Designer",
  languages: ["english", "korean"] as ("korean" | "english")[],
  profileImage: "/mock/profile-sejin.jpg",
  portfolioImage: "/mock/portfolio-sejin.jpg",
  message: "98% of Curly hair women were satisfied with Sejin.",
};

const meta = {
  title: "Discover/DesignerCard",
  component: DesignerCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    size: { control: "radio", options: ["small", "medium", "large"] },
    name: { control: "text" },
    role: { control: "text" },
    languages: { control: "object" },
    message: { control: "text" },
  },
  args: SHARED_ARGS,
} satisfies Meta<typeof DesignerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { size: "small" },
};

export const Medium: Story = {
  args: { size: "medium" },
};

export const Large: Story = {
  args: { size: "large" },
};

export const AllSizes: { render: StoryFn } = {
  render: () => (
    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
      <div>
        <p style={{ marginBottom: 8, fontSize: 12, color: "#8c8b8a" }}>small (138px)</p>
        <DesignerCard {...SHARED_ARGS} size="small" />
      </div>
      <div>
        <p style={{ marginBottom: 8, fontSize: 12, color: "#8c8b8a" }}>medium (220px)</p>
        <DesignerCard {...SHARED_ARGS} size="medium" />
      </div>
      <div>
        <p style={{ marginBottom: 8, fontSize: 12, color: "#8c8b8a" }}>large (320px)</p>
        <DesignerCard {...SHARED_ARGS} size="large" />
      </div>
    </div>
  ),
};
