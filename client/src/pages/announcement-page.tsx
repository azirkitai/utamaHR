import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ListOrdered,
  Send,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  message: string;
  status: 'New' | 'Read';
  announcer: string;
  department?: string;
  createdDate: string;
  updatedDate: string;
  attachment?: string | null;
}

// Remove dummy data - will fetch from database

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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // User role is available from useAuth hook
  
  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const { toast } = useToast();

  // Fetch real employees from database
  const { data: employeesData, isLoading: loadingEmployees } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Fetch announcements from database
  const { data: announcementsData, isLoading: loadingAnnouncements } = useQuery<any[]>({
    queryKey: ["/api/announcements"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Ensure data is always an array and update local state
  const employees = Array.isArray(employeesData) ? employeesData : [];
  
  // Update announcements when data loads using useEffect
  useEffect(() => {
    if (announcementsData && Array.isArray(announcementsData)) {
      const formattedAnnouncements = announcementsData.map((announcement: any) => ({
        id: announcement.id, // Keep as string to match database
        title: announcement.title || '',
        message: announcement.message || '',
        status: announcement.status || 'New' as const,
        announcer: announcement.announcerName || 'System',
        department: announcement.department || '',
        createdDate: announcement.createdDate || new Date(announcement.createdAt).toLocaleDateString(),
        updatedDate: announcement.updatedDate || new Date(announcement.updatedAt || announcement.createdAt).toLocaleDateString(),
        attachment: announcement.attachment || null
      }));
      setAnnouncements(formattedAnnouncements);
    }
  }, [announcementsData]);

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

  // Handle employee selection (multi-select)
  const handleEmployeeSelect = (employeeId: string, checked: boolean) => {
    if (employeeId === "all") {
      if (checked) {
        // Select all employees
        const allEmployeeIds = employees.map((emp: any) => emp.userId || emp.id);
        setSelectedEmployees(allEmployeeIds);
      } else {
        // Deselect all
        setSelectedEmployees([]);
      }
    } else {
      if (checked) {
        setSelectedEmployees(prev => [...prev, employeeId]);
      } else {
        setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
      }
    }
  };

  // Send announcement mutation
  const sendAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: any) => {
      return apiRequest("POST", "/api/announcements", announcementData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement sent successfully!",
      });
      // Reset form
      setTitle("");
      setMessage("");
      setSelectedDepartment("");
      setSelectedEmployees([]);
      setUploadedFile(null);
      setIsCreateModalOpen(false);
      // Refresh announcements list
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send announcement",
        variant: "destructive",
      });
    },
  });

  const handleSendAnnouncement = () => {
    if (!title || !message) {
      toast({
        title: "Error",
        description: "Please fill in both title and message",
        variant: "destructive",
      });
      return;
    }

    if (selectedEmployees.length === 0) {
      toast({
        title: "Error", 
        description: "Please select at least one employee",
        variant: "destructive",
      });
      return;
    }
    
    const announcementData = {
      title,
      message,
      department: selectedDepartment === "all" ? "" : selectedDepartment,
      targetEmployees: selectedEmployees,
      attachment: uploadedFile?.name || null,
    };
    
    sendAnnouncementMutation.mutate(announcementData);
  };

  // Role-based access control function
  const canAccessAnnouncementActions = () => {
    const role = (user as any)?.role;
    console.log('Announcement page - Current user role:', role);
    const hasAccess = role && ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Finance/Account', 'Manager/Supervisor'].includes(role);
    console.log('Announcement page - Has access:', hasAccess);
    return hasAccess;
  };

  const handleViewAnnouncement = (id: string) => {
    const announcement = announcements.find(a => a.id === id);
    if (announcement) {
      setSelectedAnnouncement(announcement);
      setViewDialogOpen(true);
      
      // Update status to Read
      setAnnouncements(announcements.map(a => 
        a.id === id ? { ...a, status: 'Read' as const } : a
      ));
    }
  };

  const handleEditAnnouncement = (id: string) => {
    const announcement = announcements.find(a => a.id === id);
    if (announcement) {
      setEditingAnnouncement(announcement);
      setEditTitle(announcement.title);
      setEditMessage(announcement.message);
      setEditDialogOpen(true);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncementToDelete(id);
    setDeleteConfirmOpen(true);
  };

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      return apiRequest("DELETE", `/api/announcements/${announcementId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement deleted successfully!",
      });
      // Refresh announcements list
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      // Remove from local state
      setAnnouncements(prev => prev.filter(ann => ann.id !== announcementToDelete));
      setDeleteConfirmOpen(false);
      setAnnouncementToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete announcement",
        variant: "destructive",
      });
      setDeleteConfirmOpen(false);
      setAnnouncementToDelete(null);
    },
  });

  // Edit announcement mutation
  const editAnnouncementMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; message: string }) => {
      return apiRequest("PUT", `/api/announcements/${data.id}`, {
        title: data.title,
        message: data.message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement updated successfully!",
      });
      // Refresh announcements list
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setEditDialogOpen(false);
      setEditingAnnouncement(null);
      setEditTitle("");
      setEditMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update announcement",
        variant: "destructive",
      });
    },
  });

  const handleSaveEdit = () => {
    if (!editTitle.trim() || !editMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and message",
        variant: "destructive",
      });
      return;
    }

    if (!editingAnnouncement) return;

    editAnnouncementMutation.mutate({
      id: editingAnnouncement.id,
      title: editTitle,
      message: editMessage,
    });
  };

  const confirmDeleteAnnouncement = () => {
    if (announcementToDelete !== null) {
      deleteAnnouncementMutation.mutate(announcementToDelete);
    }
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
                            <SelectItem value="all">Leave empty to indicate for everyone.</SelectItem>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Select Employee - Multi-select */}
                      <div>
                        <Label className="text-sm font-medium">Select Employee</Label>
                        <div className="mt-1 border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                          <ScrollArea className="h-full">
                            <div className="space-y-2">
                              {/* All Employee option */}
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="all-employees"
                                  checked={selectedEmployees.length === employees.length && employees.length > 0}
                                  onCheckedChange={(checked) => handleEmployeeSelect("all", !!checked)}
                                  data-testid="checkbox-all-employees"
                                />
                                <Label htmlFor="all-employees" className="text-sm font-medium text-blue-600">
                                  All Employee ({employees.length})
                                </Label>
                              </div>
                              
                              <div className="border-t pt-2 mt-2">
                                {loadingEmployees ? (
                                  <div className="text-sm text-gray-500">Loading employees...</div>
                                ) : employees.length > 0 ? (
                                  employees.map((employee: any) => (
                                    <div key={employee.id} className="flex items-center space-x-2">
                                      <Checkbox 
                                        id={`employee-${employee.userId || employee.id}`}
                                        checked={selectedEmployees.includes(employee.userId || employee.id)}
                                        onCheckedChange={(checked) => handleEmployeeSelect(employee.userId || employee.id, !!checked)}
                                        data-testid={`checkbox-employee-${employee.id}`}
                                      />
                                      <Label 
                                        htmlFor={`employee-${employee.userId || employee.id}`} 
                                        className="text-sm flex-1 cursor-pointer"
                                      >
                                        {employee.fullName} ({employee.username})
                                      </Label>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-sm text-gray-500">No employees found</div>
                                )}
                              </div>
                              
                              {selectedEmployees.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <div className="text-xs text-gray-600">
                                    {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                                  </div>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
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
                        onClick={handleSendAnnouncement}
                        disabled={!title || !message || selectedEmployees.length === 0 || sendAnnouncementMutation.isPending}
                        className="bg-slate-700 hover:bg-slate-800"
                        data-testid="button-send"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendAnnouncementMutation.isPending ? "Sending..." : "Send"}
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
        
        {/* View Announcement Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {selectedAnnouncement?.title}
              </DialogTitle>
            </DialogHeader>
            
            {selectedAnnouncement && (
              <div className="space-y-6">
                {/* Announcement Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Announcer</label>
                    <p className="text-gray-900">{selectedAnnouncement.announcer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Badge 
                      variant="default"
                      className="bg-teal-500 hover:bg-teal-600"
                    >
                      {selectedAnnouncement.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created Date</label>
                    <p className="text-gray-900">{selectedAnnouncement.createdDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Updated Date</label>
                    <p className="text-gray-900">{selectedAnnouncement.updatedDate}</p>
                  </div>
                  {selectedAnnouncement.department && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Department</label>
                      <p className="text-gray-900">{selectedAnnouncement.department}</p>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Message</label>
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="prose max-w-none">
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {selectedAnnouncement.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attachment Section - if exists */}
                {selectedAnnouncement.attachment && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Attachment</label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 hover:bg-blue-100 cursor-pointer transition-colors">
                      <Upload className="h-4 w-4 text-blue-600" />
                      <a 
                        href={`/api/announcements/attachment/${selectedAnnouncement.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-800 hover:text-blue-900 hover:underline flex-1"
                        data-testid="link-attachment"
                      >
                        {selectedAnnouncement.attachment}
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                        onClick={() => window.open(`/api/announcements/attachment/${selectedAnnouncement.id}`, '_blank')}
                        data-testid="button-download-attachment"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button 
                onClick={() => {
                  setViewDialogOpen(false);
                  setSelectedAnnouncement(null);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white"
                data-testid="button-close-view"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Announcement Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Edit Announcement
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="edit-title" className="text-sm font-medium">Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1"
                  data-testid="input-edit-announcement-title"
                />
              </div>
              
              {/* Message */}
              <div>
                <Label className="text-sm font-medium">Message</Label>
                <Textarea
                  placeholder="Enter your message..."
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="min-h-[120px] mt-1"
                  data-testid="textarea-edit-announcement-message"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingAnnouncement(null);
                  setEditTitle("");
                  setEditMessage("");
                }}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={!editTitle.trim() || !editMessage.trim() || editAnnouncementMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white"
                data-testid="button-save-edit"
              >
                {editAnnouncementMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete Announcement</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this announcement? This action cannot be undone and will remove the announcement from all users' view.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setAnnouncementToDelete(null);
                }}
                data-testid="button-cancel-delete"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteAnnouncement}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteAnnouncementMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteAnnouncementMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}