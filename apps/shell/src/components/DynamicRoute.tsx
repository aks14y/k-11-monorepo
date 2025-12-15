import { useEffect, useState } from "react";
import { Card, Stack, Heading, Text } from "@design-system";
import type { Plugin } from "plugin-registry";
import { PluginLoader } from "plugin-loader";
import type { LoadedPlugin } from "plugin-loader";

type DynamicRouteProps = {
  plugin: Plugin;
};

export const DynamicRoute = ({ plugin }: DynamicRouteProps) => {
  const [loaded, setLoaded] = useState<LoadedPlugin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loader = new PluginLoader();
    setLoading(true);
    setError(null);

    loader
      .load(plugin)
      .then((result) => {
        setLoaded(result.loaded);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [plugin]);

  if (loading) {
    return (
      <Card>
        <Stack gap="16px">
          <Heading level={2}>Loading {plugin.metadata.title}…</Heading>
          <Text variant="muted">Preparing the component.</Text>
        </Stack>
      </Card>
    );
  }

  if (error || !loaded) {
    return (
      <Card>
        <Stack gap="16px">
          <Heading level={2}>Error Loading Component</Heading>
          <Text variant="muted">{error ?? "Component not available."}</Text>
        </Stack>
      </Card>
    );
  }

  switch (loaded.kind) {
    case "html":
      return <div dangerouslySetInnerHTML={{ __html: loaded.html }} />;
    case "angular":
      return (
        <iframe
          src={loaded.iframeSrc}
          style={{ width: "100%", height: "100vh", border: "none" }}
          title={plugin.metadata.title}
        />
      );
    case "react": {
      const Component = loaded.component;
      return <Component />;
    }
    default:
      return null;
  }
};


