import { StoryDesktop } from "@/components/landing/story-desktop";
import { StoryMobile } from "@/components/landing/story-mobile";

export function Hero() {
  return (
    <>
      <div className="hidden lg:block">
        <StoryDesktop />
      </div>
      <div className="lg:hidden">
        <StoryMobile />
      </div>
    </>
  );
}
