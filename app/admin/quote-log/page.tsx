"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Eye, FileText, Search, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import type { QuoteLogEntry } from "@/lib/db"

export default function QuoteLogPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedQuote, setSelectedQuote] = useState<QuoteLogEntry | null>(null)
  const [quoteLog, setQuoteLog] = useState<QuoteLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuoteLog()
  }, [])

  const fetchQuoteLog = async () => {
    try {
      const response = await fetch("/api/quote-log")
      if (response.ok) {
        const data = await response.json()
        setQuoteLog(data)
      }
    } catch (error) {
      console.error("Error fetching quote log:", error)
      toast({
        title: "Error",
        description: "Failed to fetch quote log",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuote = async (id: string) => {
    try {
      const response = await fetch(`/api/quote-log/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setQuoteLog(quoteLog.filter((quote) => quote.id !== id))
        toast({
          title: "Success",
          description: "Quote deleted successfully",
        })
      } else {
        throw new Error("Failed to delete quote")
      }
    } catch (error) {
      console.error("Error deleting quote:", error)
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive",
      })
    }
  }

  // Filter quotes based on search term
  const filteredQuotes = quoteLog.filter(
    (quote) =>
      quote.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.catalogueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewQuote = (quote: QuoteLogEntry) => {
    setSelectedQuote(quote)
  }

  const handleDownloadPDF = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank")
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4">Loading quote log...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Quote Log</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Catalogue</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No quotes found matching your search" : "No quotes found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.id}</TableCell>
                  <TableCell>{new Date(quote.timestamp).toLocaleDateString()}</TableCell>
                  <TableCell>{quote.email}</TableCell>
                  <TableCell>{quote.catalogueName}</TableCell>
                  <TableCell className="text-right">₱{quote.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewQuote(quote)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(quote.pdfUrl)}>
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quote Details Dialog */}
      <Dialog open={!!selectedQuote} onOpenChange={(open) => !open && setSelectedQuote(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quote Details - {selectedQuote?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedQuote.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedQuote.timestamp).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Catalogue</p>
                  <p className="font-medium">{selectedQuote.catalogueName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">₱{selectedQuote.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Share Link</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                    {selectedQuote.shareLink}
                  </code>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQuote.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.name}
                            {item.customization && (
                              <Badge variant="outline" className="ml-2">
                                {item.customization}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₱{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₱{(item.quantity * item.price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleDownloadPDF(selectedQuote.pdfUrl)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
