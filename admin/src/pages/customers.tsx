import { DataTable } from '@/components/data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ApiResponse, Customer } from '@/types';
import { ArrowsDownUpIcon, SpinnerIcon, WarningCircleIcon, WarningIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<{ phone: string; savedAddress: string; id: string }>[] = [
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'savedAddress',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Saved Address
          <ArrowsDownUpIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
];

const Customers = () => {
  const { isPending, error, data } = useQuery<ApiResponse<{ customers: Customer[] }>>({
    queryKey: ['customersData'],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_BACKEND_URL}/customers`, { credentials: 'include' }).then((res) => res.json()),
  });

  if (isPending)
    return (
      <div className="w-full flex items-center justify-center">
        <SpinnerIcon className="animate-spin" />
      </div>
    );

  if (error)
    return (
      <Alert className="max-w-md mx-auto" variant={'destructive'}>
        <WarningIcon />
        <AlertTitle>Something went wrong.</AlertTitle>
        <AlertDescription>{error?.message}</AlertDescription>
      </Alert>
    );

  if (!data.success)
    return (
      <Alert className="max-w-md mx-auto">
        <WarningCircleIcon />
        <AlertTitle>Something went wrong.</AlertTitle>
        <AlertDescription>{data.message}</AlertDescription>
      </Alert>
    );

  let customersData: { phone: string; savedAddress: string; id: string }[] = [];

  if (data.data?.customers?.length > 0) {
    customersData = data.data.customers.map((c: Customer) => ({
      id: c._id,
      phone: `${c.phoneNumber.countryCode}${c.phoneNumber.number}`,
      savedAddress: `${c.savedAddress.street?.houseNumber || ''} ${
        c.savedAddress.street?.streetName || ''
      } ${c.savedAddress.street?.streetNumber || ''}, ${c.savedAddress.city || ''}, ${c.savedAddress.state || ''}, ${
        c.savedAddress.zipCode || ''
      }`,
    }));
  }

  return (
    <>
      <h1 className="text-4xl">All Customers</h1>
      <DataTable columns={columns} data={customersData} filterText="phone" />
    </>
  );
};

export default Customers;
