import Button from "./Button";

export default {
  title: "UI/Button",
  component: Button,
};

export const Primary = {
  args: {
    children: "Primary button",
    variant: "primary",
  },
};

export const Ghost = {
  args: {
    children: "Ghost button",
    variant: "ghost",
  },
};
