import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import React from 'react'
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import {z} from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';


const groupSchema = z.object({
    name:z.string().min(1,"Group name is required"),
    description :z.string().optional(),
})
const CreateGroupModal = ({isOpen , onClose ,onSuccess}) => {
    
    const{register,
        handleSubmit,
        formState:{errors ,isSubmitting},reset} =useForm({
            resolver:zodResolver(groupSchema),
            defaultValues:{
                name : "",
                description:"",
            },
        });
    const handleClose=()=>{
        reset();

        onClose();
    }
  return (
  <Dialog open={isOpen} onOpenChange={handleClose}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Group</DialogTitle>
    </DialogHeader>
    <form className='space-y-4'>
        <div className='space-y-2'>
            <Label htmlFor="name">Group Name</Label>
            <Input
            id = "name"
            placeholder = "enter group name"
            {...register("name")}
            />
            {errors.name && (
                <p className='text-sm text-red-500'>{errors.name.message}</p>
                )}
        </div>
        <div className='space-y-2'>
            <Label htmlFor="description">Group Description</Label>
            <Textarea
            id = "description"
            placeholder = "enter group description"
            {...register("description")}
            />
        </div>
    </form>
    <DialogFooter>

    </DialogFooter>
    <Button>
        
    </Button>
  </DialogContent>
</Dialog>
)
};

export default CreateGroupModal;