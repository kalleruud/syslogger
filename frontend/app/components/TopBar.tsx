type TopBarProps = {
  // TODO: make this more flexible and reusable
} & ComponentProps<"div">;

export function TopBar(props: Readonly<TopBarProps>) {
  return <div {...props}>Myapp</div>;
}
