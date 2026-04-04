import { DataTable } from '@/components/data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ApiResponse, User } from '@/types';
import { DotsThreeIcon, PlusIcon, SpinnerIcon, TrashIcon, WarningCircleIcon, WarningIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useState } from 'react';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

type UserWithIdAndPhone = Omit<User, '_id' | 'phoneNumber'> & {
  id: string;
  phone: string;
};

const formSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'please provide valid phone number.'),
  password: z.string(),
  role: z.enum(['Admin', 'Delivery Person']),
  name: z.string().max(20),
});

const AddUserCard = () => {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: undefined,
      password: undefined,
      role: undefined,
      name: undefined,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const body = JSON.stringify({
      ...data,
      phoneNumber: {
        countryCode: '+91',
        number: data['phone'].split('+91')[1],
      },
    });

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admins`, {
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
      }

      if (result.data && result.data.admin) {
        toast.success(`Admin Added Successfully.`);
      } else {
        throw new Error('Something went wrong.');
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
        <DialogTitle>Admin Details</DialogTitle>
        <DialogDescription>Enter your admin detail below to add.</DialogDescription>
      </DialogHeader>
      <form id="icecream-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input {...field} id="name" aria-invalid={fieldState.invalid} required />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input {...field} id="phone" aria-invalid={fieldState.invalid} placeholder="+911234567890" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select
                  aria-invalid={fieldState.invalid}
                  required
                  {...field}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Roles</SelectLabel>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Delivery Person">Delivery Person</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input type="password" {...field} id="password" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </form>
      <DialogFooter className="flex-col gap-2">
        <Button type="submit" form="icecream-form" className="w-full capitalize">
          {loading ? <SpinnerIcon className="animate-spin" /> : 'Add'}
        </Button>
      </DialogFooter>
    </>
  );
};

const columns: ColumnDef<UserWithIdAndPhone>[] = [
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const admin = row.original;
      const [deleteLoading, setDeleteLoading] = useState(false);

      const deleteAdmin = async (e: Event) => {
        e.preventDefault();
        setDeleteLoading(true);

        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admins/${admin.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) throw new Error('Something went wrong.');

          toast.success('Admin deleted successfully.');
        } catch (error) {
          console.log(error);
          toast.error(error instanceof Error ? error.message : 'Something went wrong.');
        } finally {
          setDeleteLoading(false);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsThreeIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem variant="destructive" className="gap-2" onSelect={deleteAdmin}>
                {deleteLoading ? (
                  <SpinnerIcon className="animate-spin" />
                ) : (
                  <>
                    <TrashIcon /> Delete
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

const Customers = () => {
  const { isPending, error, data } = useQuery<ApiResponse<{ admins: User[] }>>({
    queryKey: ['usersData'],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_BACKEND_URL}/admins`, { credentials: 'include' }).then((res) => res.json()),
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

  let usersData: UserWithIdAndPhone[] = [];

  if (data.data?.admins?.length > 0) {
    usersData = data.data.admins.map((u: User) => ({
      id: u._id,
      phone: `${u.phoneNumber.countryCode}${u.phoneNumber.number}`,
      role: u.role,
      name: u.name,
    }));
  }

  return (
    <>
      <div className="w-full flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-4xl">All Admins</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon /> Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent onKeyDown={(e) => e.stopPropagation()} onOpenAutoFocus={(e) => e.preventDefault()}>
            <AddUserCard />
          </DialogContent>
        </Dialog>
      </div>
      <DataTable columns={columns} data={usersData} filterText="phone" />
    </>
  );
};

export default Customers;
