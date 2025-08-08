import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronRight,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Upload,
  Bold,
  Italic,
  Underline,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface Announcement {
  id: number;
  title: string;
  message: string;
  status: 'New' | 'Read';
  announcer: string;
  department?: string;
  createdDate: string;
  updatedDate: string;
}

const sampleAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "wujud",
    message: "Sample announcement message here...",
    status: "New",
    announcer: "SITI NADIAH SABRI",
    createdDate: "3 Aug 2025",
    updatedDate: "3 Aug 2025"
  }
];

const departments = [
  "Human Resources",
  "Information Technology", 
  "Finance",
  "Marketing",
  "Operations",
  "Sales"
];

const employees = [
  "SITI NADIAH SABRI",
  "AHMAD ALI BIN HASSAN", 
  "FARAH DIANA BINTI MOHD",
  "MUHAMMAD HAFIZ BIN OMAR",
  "NUR AISYAH BINTI KAMAL"
];

export default function AnnouncementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>(sampleAnnouncements);

  // User role is available from useAuth hook
  
  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.announcer.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "unread") {
      return matchesSearch && announcement.status === "New";
    }
    return matchesSearch;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSaveAnnouncement = () => {
    if (!title || !message) return;
    
    const newAnnouncement: Announcement = {
      id: announcements.length + 1,
      title,
      message,
      status: "New",
      announcer: "SITI NADIAH SABRI",
      department: selectedDepartment,
      createdDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      updatedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    
    setAnnouncements([...announcements, newAnnouncement]);
    
    // Reset form
    setTitle("");
    setMessage("");
    setSelectedDepartment("");
    setSelectedEmployee("");
    setUploadedFile(null);
    setIsCreateModalOpen(false);
  };

  // Role-based access control function
  const canAccessAnnouncementActions = () => {
    const role = (user as any)?.role;
    return role && ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account', 'Manager/Supervisor'].includes(role);
  };

  const handleViewAnnouncement = (id: number) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, status: 'Read' as const } : a
    ));
    console.log("View announcement:", id);
  };

  const handleEditAnnouncement = (id: number) => {
    console.log("Edit announcement:", id);
  };

  const handleDeleteAnnouncement = (id: number) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    console.log("Delete announcement:", id);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Announcement</h1>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span>Home</span>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span>Announcement</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Tabs and Add Button */}
          <div className="flex items-center justify-between mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                    data-testid="tab-all-announcement"
                  >
                    All Announcement
                  </TabsTrigger>
                  <TabsTrigger 
                    value="unread"
                    className="data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                    data-testid="tab-unread-announcement"
                  >
                    Unread Announcement
                  </TabsTrigger>
                </TabsList>
                
                {canAccessAnnouncementActions() && (
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-slate-700 hover:bg-slate-800 text-white"
                        data-testid="button-add-announcement"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Announcement
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Announcement</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                        <Input
                          id="title"
                          placeholder="Title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="mt-1"
                          data-testid="input-announcement-title"
                        />
                      </div>
                      
                      {/* Message - Rich Text Editor (simplified) */}
                      <div>
                        <Label className="text-sm font-medium">Message</Label>
                        {/* Rich text toolbar */}
                        <div className="flex items-center gap-1 p-2 border border-gray-300 rounded-t-md bg-gray-50">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Underline className="h-4 w-4" />
                          </Button>
                          <div className="w-px h-6 bg-gray-300 mx-1" />
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <AlignLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <AlignCenter className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <AlignRight className="h-4 w-4" />
                          </Button>
                          <div className="w-px h-6 bg-gray-300 mx-1" />
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <List className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ListOrdered className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Enter your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="min-h-[120px] rounded-t-none border-t-0"
                          data-testid="textarea-announcement-message"
                        />
                      </div>
                      
                      {/* Select Department */}
                      <div>
                        <Label className="text-sm font-medium">Select Department</Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                          <SelectTrigger className="mt-1" data-testid="select-department">
                            <SelectValue placeholder="Leave empty to indicate for everyone." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Leave empty to indicate for everyone.</SelectItem>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Select Employee */}
                      <div>
                        <Label className="text-sm font-medium">Select Employee</Label>
                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                          <SelectTrigger className="mt-1" data-testid="select-employee">
                            <SelectValue placeholder="Leave empty to indicate ...none..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Leave empty to indicate ...none...</SelectItem>
                            {employees.map(emp => (
                              <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Upload Attachment */}
                      <div>
                        <Label className="text-sm font-medium">Upload Attachment</Label>
                        <div className="mt-1 flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="relative">
                            Choose file... (No File chosen)
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleFileUpload}
                              data-testid="input-file-attachment"
                            />
                          </Button>
                          <span className="text-sm text-gray-500">
                            {uploadedFile ? uploadedFile.name : "No file chosen"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter className="gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateModalOpen(false)}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveAnnouncement}
                        disabled={!title || !message}
                        className="bg-slate-700 hover:bg-slate-800"
                        data-testid="button-save"
                      >
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                )}
              </div>

              {/* Search */}
              <div className="flex items-center justify-end mt-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <TabsContent value="all">
                <Card>
                  <CardHeader className="bg-slate-700 text-white rounded-t-lg">
                    <CardTitle>Announcement</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">No</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Announcer</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Created Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Updated Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAnnouncements.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-gray-500">
                                No data available in table
                              </td>
                            </tr>
                          ) : (
                            filteredAnnouncements.map((announcement, index) => (
                              <tr key={announcement.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">{index + 1}</td>
                                <td className="py-3 px-4">{announcement.title}</td>
                                <td className="py-3 px-4">
                                  <Badge 
                                    variant={announcement.status === "New" ? "default" : "secondary"}
                                    className={cn(
                                      announcement.status === "New" 
                                        ? "bg-teal-500 hover:bg-teal-600" 
                                        : "bg-gray-500"
                                    )}
                                  >
                                    {announcement.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">{announcement.announcer}</td>
                                <td className="py-3 px-4">{announcement.createdDate}</td>
                                <td className="py-3 px-4">{announcement.updatedDate}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 bg-slate-600 hover:bg-slate-700 text-white"
                                      onClick={() => handleViewAnnouncement(announcement.id)}
                                      data-testid={`button-view-${announcement.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {canAccessAnnouncementActions() && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => handleEditAnnouncement(announcement.id)}
                                        data-testid={`button-edit-${announcement.id}`}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {canAccessAnnouncementActions() && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white"
                                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                                        data-testid={`button-delete-${announcement.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="unread">
                <Card>
                  <CardHeader className="bg-teal-500 text-white rounded-t-lg">
                    <CardTitle>Unread Announcement</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">No</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Announcer</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Created Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Updated Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAnnouncements.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-gray-500">
                                No data available in table
                              </td>
                            </tr>
                          ) : (
                            filteredAnnouncements.map((announcement, index) => (
                              <tr key={announcement.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">{index + 1}</td>
                                <td className="py-3 px-4">{announcement.title}</td>
                                <td className="py-3 px-4">
                                  <Badge 
                                    variant="default"
                                    className="bg-teal-500 hover:bg-teal-600"
                                  >
                                    {announcement.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">{announcement.announcer}</td>
                                <td className="py-3 px-4">{announcement.createdDate}</td>
                                <td className="py-3 px-4">{announcement.updatedDate}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 bg-slate-600 hover:bg-slate-700 text-white"
                                      onClick={() => handleViewAnnouncement(announcement.id)}
                                      data-testid={`button-view-unread-${announcement.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {canAccessAnnouncementActions() && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => handleEditAnnouncement(announcement.id)}
                                        data-testid={`button-edit-unread-${announcement.id}`}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {canAccessAnnouncementActions() && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white"
                                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                                        data-testid={`button-delete-unread-${announcement.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}