'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  FileText, 
  Activity, 
  Download, 
  Search,
  Users,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { AuditLog, DataExportRequest } from '@/lib/privacy/types';
import { format } from 'date-fns';

export default function AdminPrivacyDashboard() {
  const { userId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilter, setAuditFilter] = useState({
    action: '',
    userId: '',
    resourceType: '',
  });
  
  // Data requests state
  const [dataRequests, setDataRequests] = useState<DataExportRequest[]>([]);
  const [requestsFilter, setRequestsFilter] = useState('all');
  
  // Statistics state
  const [statistics, setStatistics] = useState({
    totalConsents: 0,
    activeConsents: 0,
    dataRequests: 0,
    auditEvents: 0,
  });

  useEffect(() => {
    if (userId) {
      checkAdminAccess();
    }
  }, [userId]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/members/' + userId);
      const member = await response.json();
      
      if (member.role === 'admin' || member.role === 'board') {
        setIsAdmin(true);
        await Promise.all([
          fetchAuditLogs(),
          fetchDataRequests(),
          fetchStatistics(),
        ]);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs');
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    }
  };

  const fetchDataRequests = async () => {
    try {
      const response = await fetch('/api/admin/data-requests');
      if (!response.ok) throw new Error('Failed to fetch data requests');
      const data = await response.json();
      setDataRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching data requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data requests',
        variant: 'destructive',
      });
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/privacy-stats');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/export');
      if (!response.ok) throw new Error('Failed to export audit logs');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast({
        title: 'Success',
        description: 'Audit logs exported successfully',
      });
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('delete')) return 'destructive';
    if (action.includes('update') || action.includes('grant')) return 'default';
    if (action.includes('view') || action.includes('export')) return 'secondary';
    return 'outline';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Privacy & Compliance Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor privacy compliance and audit trails
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Consents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalConsents}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Consents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeConsents}</div>
            <p className="text-xs text-muted-foreground">Currently granted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.dataRequests}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.auditEvents}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="requests">Data Requests</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Audit Logs
                  </CardTitle>
                  <CardDescription>
                    Track all privacy-related actions in the system
                  </CardDescription>
                </div>
                <Button onClick={handleExportAuditLogs} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Filter by user ID..."
                  value={auditFilter.userId}
                  onChange={(e) => setAuditFilter(prev => ({ ...prev, userId: e.target.value }))}
                  className="max-w-xs"
                />
                <Select
                  value={auditFilter.action}
                  onValueChange={(value) => setAuditFilter(prev => ({ ...prev, action: value }))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="consent">Consent</SelectItem>
                    <SelectItem value="privacy">Privacy</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs
                        .filter(log => 
                          (!auditFilter.userId || log.userId?.includes(auditFilter.userId)) &&
                          (!auditFilter.action || log.action.includes(auditFilter.action))
                        )
                        .slice(0, 10)
                        .map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.userId ? log.userId.substring(0, 8) : 'System'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getActionBadgeVariant(log.action)}>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.resourceType && (
                                <span className="text-muted-foreground">
                                  {log.resourceType}
                                  {log.resourceId && ` #${log.resourceId.substring(0, 8)}`}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.ipAddress || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Requests
              </CardTitle>
              <CardDescription>
                Manage data export and deletion requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Select
                  value={requestsFilter}
                  onValueChange={setRequestsFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All requests</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No data requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      dataRequests
                        .filter(req => requestsFilter === 'all' || req.status === requestsFilter)
                        .map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              {format(new Date(request.requestedAt), 'yyyy-MM-dd HH:mm')}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {request.userId.substring(0, 8)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={request.requestType === 'deletion' ? 'destructive' : 'default'}>
                                {request.requestType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(request.status)}>
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {request.completedAt ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                  {format(new Date(request.completedAt), 'yyyy-MM-dd')}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
              <CardDescription>
                FERPA, COPPA, and GDPR compliance status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>FERPA Compliant:</strong> Educational records are protected with proper access controls
                </AlertDescription>
              </Alert>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>COPPA Compliant:</strong> Parental consent system implemented for users under 13
                </AlertDescription>
              </Alert>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>GDPR Ready:</strong> Data export and deletion capabilities are fully functional
                </AlertDescription>
              </Alert>

              <div className="pt-4">
                <h3 className="font-semibold mb-2">Key Compliance Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-600" />
                    Field-level privacy controls
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    Granular consent management
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    Comprehensive audit logging
                  </li>
                  <li className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-green-600" />
                    Data portability (export/delete)
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    Role-based access control
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}