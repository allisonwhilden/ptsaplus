# Type Definitions

This directory contains TypeScript type definitions for the PTSA+ platform.

## Files

### `database.ts`
Contains business logic interfaces and types that match our database schema. These are the types used throughout the application for type safety.

### `supabase.ts`
Contains the generated Supabase database types. This file provides complete type safety for Supabase queries.

**Important**: This file should be regenerated whenever the database schema changes.

## Generating Supabase Types

To generate or update the Supabase types:

1. Set your Supabase project ID:
   ```bash
   export SUPABASE_PROJECT_ID=your-project-id
   ```

2. Run the generation script:
   ```bash
   npm run generate:types
   ```

Alternatively, you can use the Supabase CLI directly:
```bash
supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts
```

## Type Usage

When using Supabase queries, the types are automatically inferred:

```typescript
import { getSupabaseServiceClient } from '@/lib/supabase-server'

const supabase = getSupabaseServiceClient()

// TypeScript knows this returns Member[] or null
const { data: members, error } = await supabase
  .from('members')
  .select('*')

// No type assertions needed!
members?.forEach(member => {
  console.log(member.first_name) // TypeScript knows all the properties
})
```

## Best Practices

1. **Always use the typed Supabase client** from `@/lib/supabase-server`
2. **Regenerate types** after database schema changes
3. **Use destructuring** to get data and error from queries
4. **Check for errors** before using the data
5. **Avoid type assertions** - let TypeScript infer the types