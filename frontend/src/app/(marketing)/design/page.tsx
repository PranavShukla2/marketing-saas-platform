"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Activity, Check, Download, Plus, Settings2, Trash2 } from "lucide-react";
import {
  Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  CountUp, Field, Hint, Input, Skeleton, Switch, Tabs, TabsContent, TabsList, TabsTrigger,
} from "../../../components/ui";

const ChartShowcase = dynamic(() => import("./ChartShowcase"), {
  ssr: false,
  loading: () => <Skeleton className="h-[220px] w-full" />,
});

/**
 * Living reference for the design system — every primitive, every variant, in
 * whichever theme you're viewing. Kept as a real route so it can't drift from
 * the components it documents (a Figma board silently can).
 */
export default function DesignSystemPage() {
  const [on, setOn] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [figure, setFigure] = useState(48120);

  return (
    <div className="min-h-screen bg-[var(--page)] px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-12">
        <header>
          <Badge tone="accent" dot>Design system</Badge>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)]">Primitives</h1>
          <p className="mt-2 text-[var(--ink-2)]">
            Every component, in the theme you&apos;re using. Switch themes in the navbar to check both.
          </p>
        </header>

        <Section title="Buttons" desc="Seven variants, four sizes, loading and disabled states.">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="solid">Solid</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="glass">Glass</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="outline" aria-label="Settings"><Settings2 /></Button>
            <Button pill variant="outline">Pill</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button variant="outline"><Download />With icon</Button>
          </div>
        </Section>

        <Section title="Cards" desc="Content surfaces stay opaque; glass is for chrome.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader><div><CardTitle>Solid</CardTitle><CardDescription>Default content surface</CardDescription></div></CardHeader>
              <CardContent><p className="text-sm text-[var(--ink-2)]">Resting elevation.</p></CardContent>
            </Card>
            <Card variant="glass">
              <CardHeader><div><CardTitle>Glass</CardTitle><CardDescription>Chrome and overlays</CardDescription></div></CardHeader>
              <CardContent><p className="text-sm text-[var(--ink-2)]">Blurred backdrop.</p></CardContent>
            </Card>
            <Card variant="feature" interactive>
              <CardHeader><div><CardTitle>Feature</CardTitle><CardDescription>Hover to lift</CardDescription></div></CardHeader>
              <CardContent><p className="text-sm text-[var(--ink-2)]">Raised, accented.</p></CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Badges" desc="Each tone carries a dark counterpart.">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success" dot>Live</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="info">Info</Badge>
          </div>
        </Section>

        <Section title="Tabs" desc="Active marker slides between triggers.">
          <div className="space-y-6">
            <Tabs defaultValue="a" group="demo-seg">
              <TabsList>
                <TabsTrigger value="a">Overview</TabsTrigger>
                <TabsTrigger value="b">Audience</TabsTrigger>
                <TabsTrigger value="c">Channels</TabsTrigger>
              </TabsList>
              <TabsContent value="a" className="pt-4 text-sm text-[var(--ink-2)]">Overview panel.</TabsContent>
              <TabsContent value="b" className="pt-4 text-sm text-[var(--ink-2)]">Audience panel.</TabsContent>
              <TabsContent value="c" className="pt-4 text-sm text-[var(--ink-2)]">Channels panel.</TabsContent>
            </Tabs>
            <Tabs defaultValue="x" group="demo-underline">
              <TabsList variant="underline">
                <TabsTrigger variant="underline" value="x">Daily</TabsTrigger>
                <TabsTrigger variant="underline" value="y">Weekly</TabsTrigger>
                <TabsTrigger variant="underline" value="z">Monthly</TabsTrigger>
              </TabsList>
              <TabsContent value="x" className="pt-4 text-sm text-[var(--ink-2)]">Daily panel.</TabsContent>
              <TabsContent value="y" className="pt-4 text-sm text-[var(--ink-2)]">Weekly panel.</TabsContent>
              <TabsContent value="z" className="pt-4 text-sm text-[var(--ink-2)]">Monthly panel.</TabsContent>
            </Tabs>
          </div>
        </Section>

        <Section title="Form" desc="Errors are announced, not just coloured.">
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <Field label="Workspace name" htmlFor="ws" hint="Shown to your clients.">
              <Input id="ws" placeholder="Acme Marketing" />
            </Field>
            <Field label="Email" htmlFor="em" error={invalid ? "Enter a valid email address." : undefined}>
              <Input id="em" type="email" placeholder="you@company.com" invalid={invalid} />
            </Field>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 text-sm text-[var(--ink-2)]">
              <Switch checked={on} onCheckedChange={setOn} /> Weekly digest
            </label>
            <Button variant="outline" size="sm" onClick={() => setInvalid((v) => !v)}>Toggle error state</Button>
          </div>
        </Section>

        <Section title="Overlays" desc="Dialog traps focus; tooltip is keyboard-reachable.">
          <div className="flex flex-wrap items-center gap-3">
            <Dialog>
              <DialogTrigger asChild><Button variant="outline"><Plus />Open dialog</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a teammate</DialogTitle>
                  <DialogDescription>They&apos;ll get their own login for this workspace.</DialogDescription>
                </DialogHeader>
                <Field label="Email" htmlFor="inv"><Input id="inv" placeholder="teammate@company.com" /></Field>
                <DialogFooter>
                  <Button variant="ghost">Cancel</Button>
                  <Button><Check />Send invite</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Hint label="Tab to me — tooltips are keyboard-reachable">
              <Button variant="ghost" size="icon" aria-label="Activity"><Activity /></Button>
            </Hint>

            <Button variant="outline" onClick={() => toast.success("Branding saved", { description: "Applied to dashboards and reports." })}>
              Toast
            </Button>
            <Button variant="ghost" onClick={() => toast.error("Couldn't reach Google Analytics", { description: "Check the connection and retry." })}>
              <Trash2 />Error toast
            </Button>
          </div>
        </Section>

        <Section title="Charts" desc="Wrapped so tooltips, axes and grids read from the tokens.">
          <Card padding="lg"><ChartShowcase /></Card>
        </Section>

        <Section title="Numbers" desc="Counts up between values, not from zero every time.">
          <div className="flex flex-wrap items-end gap-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Active users</p>
              <CountUp value={figure} className="text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Revenue</p>
              <CountUp
                value={figure * 1.7}
                format={(n) => "$" + Math.round(n).toLocaleString()}
                className="text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setFigure((v) => Math.round(v * (0.7 + Math.random() * 0.8)))}>
              New figure
            </Button>
          </div>
        </Section>

        <Section title="Skeletons" desc="Shaped like the content, so nothing jumps.">
          <Card className="max-w-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-32" />
            <Skeleton className="mt-4 h-10 w-full" />
          </Card>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
        <p className="text-sm text-[var(--ink-3)]">{desc}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
