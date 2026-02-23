import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cookieBannerSchema } from "../types/banner";
import type { CookieBanner } from "../types/banner";
import { Button } from "~/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

interface BannerFormProps {
    initialData?: Partial<CookieBanner>;
    onSubmit: (data: CookieBanner) => void;
    isLoading?: boolean;
}

export function BannerForm({ initialData, onSubmit, isLoading }: BannerFormProps) {
    const form = useForm<CookieBanner>({
        // @ts-expect-error Zod union default type discrepancy
        resolver: zodResolver(cookieBannerSchema),
        defaultValues: {
            ...initialData,
            name: initialData?.name || "",
            domain: initialData?.domain || "",
            active: initialData?.active ?? true,
            title: initialData?.title || "",
            message: initialData?.message || "",
            accept_button_text: initialData?.accept_button_text || "Accept All",
            reject_button_text: initialData?.reject_button_text || "Reject All",
            settings_button_text: initialData?.settings_button_text || "Settings",
            theme: initialData?.theme || "light",
            position: initialData?.position || "bottom",
        },
    });

    const formData = form.watch();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Form Fields */}
                <div className="space-y-6 pr-4">
                    {/* General Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">General</h3>
                        <FormField
                            control={form.control as any}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Internal Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., EU Banner" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="domain"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Domain</FormLabel>
                                    <FormControl>
                                        <Input placeholder="example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            Enable or disable this banner.
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator />

                    {/* Content Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Content</h3>
                        <FormField
                            control={form.control as any}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Cookie Preferences" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="We use cookies to enhance your experience..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control as any}
                                name="accept_button_text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Accept Button</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="reject_button_text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reject Button</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="settings_button_text"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Settings Button</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Appearance Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Appearance</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control as any}
                                name="theme"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Theme</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select theme" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="light">Light</SelectItem>
                                                <SelectItem value="dark">Dark</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="position"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Position</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select position" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="bottom">Bottom</SelectItem>
                                                <SelectItem value="top">Top</SelectItem>
                                                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side: Live Preview */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex-1 space-y-4">
                        <h3 className="text-lg font-medium">Live Preview</h3>
                        <p className="text-sm text-slate-500">See how your banner looks</p>

                        <div className="relative border rounded-lg bg-gray-100 overflow-hidden" style={{ height: "400px" }}>
                            <div
                                className={`absolute left-0 right-0 p-6 shadow-lg rounded-lg transition-all
                                ${formData.position?.includes("bottom") ? "bottom-0" : "top-0"}
                                ${formData.position?.includes("left") ? "w-80 left-4" : formData.position?.includes("right") ? "w-80 right-4 left-auto" : "m-4"}
                                ${formData.theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
                            `}
                            >
                                <h3 className="text-xl font-bold mb-2">{formData.title}</h3>
                                <p className={`text-sm mb-4 ${formData.theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                                    {formData.message}
                                </p>
                                <div className="flex gap-3 flex-wrap">
                                    <Button
                                        type="button"
                                        className={formData.theme === "dark" ? "bg-white text-black hover:bg-slate-200" : ""}
                                    >
                                        {formData.accept_button_text}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={formData.theme === "dark" ? "border-slate-700 text-white hover:bg-slate-800" : ""}
                                    >
                                        {formData.reject_button_text}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className={formData.theme === "dark" ? "text-slate-300 hover:text-white hover:bg-slate-800" : ""}
                                    >
                                        {formData.settings_button_text}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-auto border-t">
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? "Saving..." : "Save Banner"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
