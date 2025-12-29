import { Heading, Text } from "@design-system";

type MonitoringAppProps = {
  onCardClick?: (cardType: "database" | "backup") => void;
  userEmail?: string;
};

export const MonitoringApp = ({ onCardClick, userEmail }: MonitoringAppProps) => {
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-6 h-6 relative">
          <div className="w-full h-full bg-surface border border-border rounded-sm relative before:content-[''] before:absolute before:top-1 before:left-1 before:right-1 before:h-0.5 before:bg-muted before:rounded-sm after:content-[''] after:absolute after:top-2 after:left-1 after:right-1 after:h-0.5 after:bg-muted after:rounded-sm" />
          <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-[#FCD34D] rounded-sm" />
        </div>
        <Heading level={1} className="m-0 text-3xl font-bold text-foreground">
          Monitoring
        </Heading>
        {userEmail && (
          <Text variant="muted" className="text-sm text-muted ml-auto">
            Signed in as: {userEmail}
          </Text>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 max-w-[600px]">
        <div
          onClick={() => onCardClick?.("database")}
          className="bg-surface rounded-md p-8 shadow-md border border-border flex flex-col items-center cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="w-16 h-16 mb-6 flex items-center justify-center text-green-600">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect x="20" y="16" width="32" height="32" rx="3" fill="currentColor" opacity="0.15" />
              <line x1="26" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="26" y1="32" x2="46" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="26" y1="40" x2="46" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="8,32 20,24 20,40" fill="currentColor" />
            </svg>
          </div>
          <Text className="text-base font-semibold text-foreground mb-1 text-center">Database</Text>
          <Text variant="muted" className="text-sm text-muted text-center">Database</Text>
        </div>

        <div
          onClick={() => onCardClick?.("backup")}
          className="bg-surface rounded-md p-8 shadow-md border border-border flex flex-col items-center cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="w-16 h-16 mb-6 flex items-center justify-center text-green-600">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="3" />
              <path
                d="M 32 10 A 22 22 0 0 1 50 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 46 14 L 50 18 L 46 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="32" r="2" fill="currentColor" />
              <line
                x1="32"
                y1="32"
                x2="28"
                y2="28"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="32"
                y1="32"
                x2="32"
                y2="24"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <Text className="text-base font-semibold text-foreground mb-1 text-center">Backup</Text>
          <Text variant="muted" className="text-sm text-muted text-center">Backup</Text>
        </div>
      </div>
    </div>
  );
};
