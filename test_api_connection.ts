import { load } from "@std/dotenv";
import { GraphQLClient } from "graphql-request";

// Load environment variables
await load({ export: true });

const LINEAR_API_KEY = Deno.env.get("LINEAR_API_KEY");

if (!LINEAR_API_KEY) {
  console.error("Error: LINEAR_API_KEY not found in environment");
  Deno.exit(1);
}

const client = new GraphQLClient("https://api.linear.app/graphql", {
  headers: {
    Authorization: LINEAR_API_KEY,
  },
});

// Test query to get viewer (current user) and organization info
const query = `
  query TestConnection {
    viewer {
      id
      name
      email
    }
    organization {
      id
      name
      urlKey
    }
    teams {
      nodes {
        id
        key
        name
      }
    }
  }
`;

try {
  console.log("Testing Linear API connection...\n");
  const data = await client.request(query);

  console.log("✓ Connection successful!\n");
  console.log("Viewer:", data.viewer);
  console.log("\nOrganization:", data.organization);
  console.log("\nTeams:");
  data.teams.nodes.forEach((team: any) => {
    console.log(`  - ${team.name} (${team.key})`);
  });
} catch (error) {
  console.error("✗ Connection failed:", error);
  Deno.exit(1);
}
