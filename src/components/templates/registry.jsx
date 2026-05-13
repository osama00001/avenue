import BlogHero, { BlogHeroConfig } from "./blocks/BlogHero";
import ImageText, { ImageTextConfig } from "./blocks/ImageText";
import RichText, { RichTextConfig } from "./blocks/RichText";
import QuoteBlock, { QuoteConfig } from "./blocks/QuoteBlock";
import CTA, { CTAConfig } from "./blocks/CTA";
import PolicyAccordion, {
  PolicyAccordionConfig,
} from "./blocks/PolicyAccordion";

export const TEMPLATE_REGISTRY = {
  blogHero: { component: BlogHero, config: BlogHeroConfig },
  imageText: { component: ImageText, config: ImageTextConfig },
  richText: { component: RichText, config: RichTextConfig },
  quote: { component: QuoteBlock, config: QuoteConfig },
  cta: { component: CTA, config: CTAConfig },
  policyAccordion: {
    component: PolicyAccordion,
    config: PolicyAccordionConfig,
  },
};
