import AccountInfoDisplay from '@/components/account-info-display';

import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const parseId = (id: string): number => {
  const numId = Number.parseInt(id, 10);
  if (Number.isNaN(numId)) {
    throw new TypeError('Invalid account ID. Must be a number.');
  }
  return numId;
};

// The component that will render when the route matches
export const Route = createFileRoute('/_protected/accounts/$id')({
  loader: async ({ params }) => {
    // Convert string ID to number
    const numericId = parseId(params.id);

    // Use the numeric ID in your fetch
    const response = await fetch(`/api/accounts/${numericId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch account');
    }
    return response.json();
  },
  beforeLoad: ({ params }) => {
    if (!('id' in params)) {
      throw new Error('Invalid account ID. Must be a number.');
    }
    // TypeScript now knows params.id exists and is a string
    if (!/^\d+$/.test(params.id)) {
      throw new Error('Invalid account ID. Must be a number.');
    }
  },

  // The loader also has typed params

  component: AccountByID,
});

function AccountByID() {
  // Access the route parameters
  const { id } = useParams({ from: '/_protected/accounts/$id' });
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAccount() {
      try {
        setLoading(true);
        // Use the ID parameter to fetch data
        const response = await fetch(`/api/accounts/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch account');
        }
        const data = await response.json();
        setAccount(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAccount();
  }, [id]);

  if (loading) {
    return <div>Loading account details...</div>;
  }
  if (error) {
    return (
      <div>
        Error:
        {error}
      </div>
    );
  }
  if (!account) {
    return <div>Account not found</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link to="/_protected/accounts" className="text-blue-600 hover:underline">
          ← Back to Accounts
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-4">
        Account Details (ID:
        {id}
        )
      </h1>

      {/* Use your AccountInfoDisplay component with the fetched account */}
      <AccountInfoDisplay account={account} />
    </div>
  );
}
