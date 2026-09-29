# AvaSquishi — Concept Document

**Prepared by:** Juan Wiley
**For:** Fetch (review and critique), then kept on file with Marketing
**Status:** Draft for review, September 2026
**Live site:** avasquishi.com

---

## 1. The idea in one line

**Squishy toys for kids, picked by a kid.**

AvaSquishi is a small online shop run by Ava, a kid who loves squishy toys. Ava picks everything the shop sells, and the shop sells only what she'd want herself.

## 2. Why it exists

Ava had a shelf full of squishies and an idea: *"Wouldn't it be cool to share the squishies I love with other kids?"* AvaSquishi is that idea, built into a real store with real checkout, shipping, and customer care.

Anyone can buy squishies at a big-box store or on a marketplace, so the shop has to offer something those don't:

- **Curation over catalog.** A short list of toys that a kid has actually squeezed and approved, instead of a thousand random listings.
- **A real person behind it.** A kid-run shop with a story, which lets it feel warm and personal in a way a marketplace listing can't.
- **Grown-up reliability.** Clear safety information, predictable shipping, easy returns, and a secure checkout. A parent should trust it as much as a large retailer.

## 3. Who it's for

| | Who | What they care about |
|---|---|---|
| **Player** | Kids ages 3 and up who love squishy, squeezable toys | Cute, soft, satisfying, new designs, "a kid picked this" |
| **Buyer** | Parents, grandparents, relatives, gift-givers | Safety, age-appropriateness, price, fast and predictable delivery, easy returns |
| **Influencer** | Older kids and tweens who follow squishy trends | Novelty, collectability, what's new |

The kid chooses and the adult pays, so every message has to appeal to the kid and reassure the adult.

## 4. The offer

- **Products:** Squishy novelty and sensory-play toys for ages 3+. Many come in fun shapes, including food-inspired ones, and are clearly labeled as toys, not food.
- **Freshness:** The home page leads with the four newest in-stock products. The shop page has curated groups: *Recommended*, *New arrivals*, and *All products*.
- **Small touches:** A free sticker in every order. Ships from Dobbs Ferry, NY. "Kid-approved squish factor."
- **Sales:** Products can carry a sale price or a percentage discount, and the shop shows the original price struck through.

## 5. How buying works (current, live)

| Area | Policy |
|---|---|
| **Checkout** | Secure card payment through Stripe. No account is needed to buy. |
| **Stock** | Checkout will not sell more than is in stock. |
| **Shipping cost** | Flat $6.99, and **free on orders of $40 or more** |
| **Processing** | 3–5 business days |
| **Delivery** | About 5–8 business days after shipping. US only. |
| **Tracking** | Emailed when the order ships |
| **Returns** | Within 30 days, for unused items in original packaging |
| **Damaged or wrong item** | Replacement or full refund, with no return needed |
| **Accounts** | Sign-in by emailed link, with no password. After checkout, a buyer can claim the order and see 90 days of order history. |
| **Support** | support@avasquishi.com, with replies within 1–2 business days |

## 6. Brand and voice

- **Look:** Soft pastels (lavender background, peach, mint, blush pink) with a deep plum used for text and the logo. Rounded, pill-shaped buttons. Poppins typeface. The shop should feel like a squishy looks.
- **Voice:** Warm, cheerful, simple, and written the way Ava would talk. Light use of emoji (💛 🎉 🚚). The voice turns plainer when the subject is safety, money, or problems.
- **Tagline in use:** *"Squishy toys for kids, by a kid."*
- **Promise:** "No fillers, no junk. Just soft, squishy, squeezable things that make you smile."

## 7. How it's built (brief)

- A custom storefront, not a template marketplace shop. It runs on Next.js and is hosted on Vercel.
- Inventory, orders, and customer accounts live in a database (Supabase). Card payments go through Stripe using WileyPay, a payments platform that can run more than one store. AvaSquishi is one store on that platform.
- Content pages that are already live: About, FAQ, Shipping, Returns, Safety, Contact, Terms, Privacy.

The details matter to Marketing mainly for one reason: we control the whole experience. That includes page content, product groupings, promotions, and the post-purchase flow, so campaigns can change them without waiting on a third-party platform.

## 8. Marketing starting points (proposals, not decided)

These are hypotheses for Fetch to push on:

1. **Lead with Ava's picks.** Present new drops as "Ava's latest favorites," with short notes in her voice about why she likes each one.
2. **Push the $40 free-shipping threshold.** Use bundles and "pick 4" sets that land just over $40.
3. **Make gifting easy.** Birthdays, party favors, stocking stuffers, and Easter baskets, with messaging aimed at the adult buyer.
4. **Use the sticker and the unboxing.** The free sticker and the packaging are shareable moments.
5. **Build repeat visits.** Regular new arrivals give people a reason to come back. The shop doesn't yet collect email sign-ups, so we can't tell anyone about new arrivals. See §10.

## 9. What we want from Fetch

Please be direct. We want critique more than approval.

1. **Positioning.** Is "by a kid" strong enough to stand out against Amazon, Target, Five Below, and TikTok Shop? What would make it stronger?
2. **Audience.** Are we talking to the right person at the right moment (kid vs. parent vs. gift-giver)?
3. **Pricing and shipping.** Is $6.99 flat with free shipping at $40 the right lever for a low-price toy category?
4. **Trust.** Does the site give a parent enough reason to buy from a small shop they've never heard of?
5. **Voice.** Does the copy sound like a real kid without feeling like a gimmick?
6. **Channels.** Where should the first marketing effort go?
7. **Blind spots.** What are we not seeing?

## 10. Known gaps and risks (please review)

**Safety and compliance: the highest priority**
- Squishies as a category have faced regulatory scrutiny. In 2018, Denmark's environmental agency found harmful chemicals in some squishy toys. Our product copy should be backed by supplier testing documentation for US children's products (for example, CPSIA and ASTM F963), and we should decide whether to say so publicly.
- Food-shaped toys need a consistent "not food, don't put in mouth" message. The Safety page says this today, but product pages and marketing materials should say it too.

**Kid-founder messaging**
- The story depends on Ava. We need clear rules for how much of her identity appears in marketing (name, photos, age, location) and who approves it.
- The Privacy Policy says we don't knowingly collect data from children under 13 without verifiable parental consent. Any marketing aimed at kids, such as contests, sign-ups, or social features, has to respect that.

**Product and site gaps**
- There's no email or newsletter sign-up, so we have no way to tell past visitors about new arrivals.
- There are no social links, customer reviews, or photos from buyers, which means little social proof.
- "Recommended for you" is a hand-picked list, not personalized. The label may promise more than it delivers.
- The home-page carousel slides have no call-to-action text yet.
- The store ships to the US only.

**Business**
- With low-price items, a flat shipping fee and free shipping at $40 could squeeze margins. We should check this against real order sizes.
- Any big retailer can copy the product, so the curation and the story have to do the work.

## 11. Facts Marketing should keep consistent

| Fact | Value |
|---|---|
| Brand name | AvaSquishi (capital A, capital S) |
| Tagline | Squishy toys for kids, by a kid. |
| Age guidance | Ages 3 and up. Adult supervision recommended. |
| Ships from | Dobbs Ferry, NY |
| Shipping | $6.99 flat, free at $40+, US only |
| Returns | 30 days, unused, original packaging |
| Support | support@avasquishi.com, 1–2 business day reply |
| Payments | Stripe (secure; we never store full card details) |
| Brand colors | Lavender `#f2ecf4`, Peach `#fee6d3`, Mint `#c2e5d8`, Blush `#fbc8cb`, Plum `#784476` |
| Typeface | Poppins |

---

*Please send comments and critique back to Juan. Marketing will keep this document as the reference for AvaSquishi's positioning and facts, and it will be updated after Fetch's review.*
