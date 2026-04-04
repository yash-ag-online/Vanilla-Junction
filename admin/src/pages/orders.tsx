import type { ApiResponse, Order } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  ArrowUpIcon,
  CheckIcon,
  DotsThreeIcon,
  SealQuestionIcon,
  SpinnerIcon,
  WarningCircleIcon,
  WarningIcon,
  XIcon,
} from '@phosphor-icons/react';
import { DataTable } from '@/components/data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type OrderWithId = Omit<Order, '_id' | 'deliveryAddress' | 'deliveryDate'> & {
  id: string;
  deliveryAddress: string;
  deliveryDate: string;
};

const ordersColumns: ColumnDef<OrderWithId>[] = [
  // {
  //   id: 'select',
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: 'totalPrice',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Total
          <ArrowUpIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'totalDiscount',
    header: 'Discount',
  },
  {
    accessorKey: 'orderStatus',
    header: 'Status',
  },
  {
    accessorKey: 'deliveryStatus',
    header: 'Delivery Status',
  },
  {
    accessorKey: 'deliveryDate',
    header: 'Delivery Date',
  },
  {
    accessorKey: 'customerId',
    header: 'Customer ID',
  },
  {
    accessorKey: 'deliveryPersonId',
    header: 'Delivery Person ID',
  },
  {
    accessorKey: 'paymentId',
    header: 'Payment ID',
  },
  {
    accessorKey: 'deliveryAddress',
    header: 'Address',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const order = row.original;

      const [acceptLoading, setAcceptLoading] = useState(false);
      const [cancelLoading, setCancelLoading] = useState(false);

      if (order.orderStatus === 'Canceled' || order.orderStatus === 'Delivered') return <></>;

      const acceptOrder = async (e: Event) => {
        e.preventDefault();
        setAcceptLoading(true);

        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders/${order.id}/accept-delivery`, {
            method: 'POST',
            credentials: 'include',
          });

          if (!response.ok) throw new Error('Something went wrong.');

          toast.success('Delivery accepted successfully.');
        } catch (error) {
          console.log(error);
          toast.error(error instanceof Error ? error.message : 'Something went wrong.');
        } finally {
          setAcceptLoading(false);
        }
      };

      const cancelOrder = async (e: Event) => {
        e.preventDefault();
        setCancelLoading(true);

        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders/${order.id}/cancel`, {
            method: 'POST',
            credentials: 'include',
          });

          if (!response.ok) throw new Error('Something went wrong.');

          toast.success('Delivery canceled successfully.');
        } catch (error) {
          console.log(error);
          toast.error(error instanceof Error ? error.message : 'Something went wrong.');
        } finally {
          setCancelLoading(false);
        }
      };

      const VerifyInput = () => {
        const [loading, setLoading] = useState(false);

        const formSchema = z.object({
          otp: z.string().max(6).min(6),
        });

        const form = useForm<z.infer<typeof formSchema>>({
          resolver: zodResolver(formSchema),
          defaultValues: {
            otp: undefined,
          },
        });

        const onSubmit = async (data: z.infer<typeof formSchema>) => {
          const body = JSON.stringify(data);

          setLoading(true);

          try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders/${order.id}/verify-otp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body,
              credentials: 'include',
            });

            if (!response) {
              throw new Error('Something went wrong.');
            }

            const result = await response.json();

            if (!result) {
              throw new Error('Something went wrong.');
            }

            if (!response.ok) {
              throw new Error(result.message || 'Something went wrong.');
            } else {
              toast.success('Verification Successfull.');
            }
          } catch (error) {
            console.log(error);
            toast.error(error && error instanceof Error ? error.message : 'Something went wrong.');
          } finally {
            setLoading(false);
          }
        };

        return (
          <>
            <DialogHeader>
              <DialogTitle>OTP</DialogTitle>
              <DialogDescription>Enter otp below to verify.</DialogDescription>
            </DialogHeader>
            <form id="icecream-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="otp"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="otp">OTP</FieldLabel>
                      <Input {...field} id="otp" aria-invalid={fieldState.invalid} required />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
            <DialogFooter className="flex-col gap-2">
              <Button type="submit" form="icecream-form" className="w-full capitalize">
                {loading ? <SpinnerIcon className="animate-spin" /> : 'Verify'}
              </Button>
            </DialogFooter>
          </>
        );
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsThreeIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {order.orderStatus === 'Pending' || order.orderStatus === 'Confirm' ? (
                <DropdownMenuItem className="gap-2" onSelect={acceptOrder}>
                  {acceptLoading ? (
                    <SpinnerIcon className="animate-spin" />
                  ) : (
                    <>
                      <CheckIcon /> Accept
                    </>
                  )}
                </DropdownMenuItem>
              ) : order.orderStatus === 'Out for delivery' ? (
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Dialog>
                    <DialogTrigger className="flex items-center gap-2 w-full">
                      <SealQuestionIcon /> Verify
                    </DialogTrigger>
                    <DialogContent onKeyDown={(e) => e.stopPropagation()} onOpenAutoFocus={(e) => e.preventDefault()}>
                      <VerifyInput />
                    </DialogContent>
                  </Dialog>
                </DropdownMenuItem>
              ) : (
                <></>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="gap-2" onSelect={cancelOrder}>
                {cancelLoading ? (
                  <SpinnerIcon className="animate-spin" />
                ) : (
                  <>
                    <XIcon /> Cancel
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

const Orders = () => {
  const { isPending, error, data } = useQuery<ApiResponse<{ orders: Order[] }>>({
    queryKey: ['ordersData'],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_BACKEND_URL}/orders`, { credentials: 'include' }).then((res) => res.json()),
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

  let ordersData: OrderWithId[] = [];

  if (data.data?.orders?.length > 0) {
    ordersData = data.data.orders.map((o: Order) => ({
      ...o,
      id: o._id,
      totalPrice: Number(o.totalPrice.toFixed(2)),
      totalDiscount: Number(o.totalDiscount.toFixed(2)),
      deliveryDate: new Date(o.deliveryDate).toLocaleDateString('en-GB'),
      deliveryAddress: `${
        o.deliveryAddress?.street?.streetName || ''
      } ${o.deliveryAddress?.street?.streetNumber || ''}, ${o.deliveryAddress?.city || ''}, ${o.deliveryAddress?.state || ''}, ${
        o.deliveryAddress?.zipCode || ''
      }`,
    }));
  }

  return (
    <>
      <h1 className="text-4xl">All Orders</h1>
      <DataTable columns={ordersColumns} data={ordersData} filterText="deliveryAddress" />
    </>
  );
};

export default Orders;
