import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'


interface AppPaginationProps {
    currentPage : number,
    totalPages : number,
    onPageChange : (page : number) => void,

}

export default function AppPagination({currentPage, totalPages,onPageChange}: AppPaginationProps) {
 if(totalPages <= 1) return null;
    return (
   <Pagination>
    <PaginationContent>
        <PaginationItem>
            <PaginationPrevious onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}/>
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1;

          return (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page);
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
          />
        </PaginationItem>
    </PaginationContent>
   </Pagination>
  )
}
