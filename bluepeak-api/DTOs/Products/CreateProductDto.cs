using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.DTOs.Products;
public class CreateProductDto
{
    [Required]
    public string ProductCode { get; set; } = "";

    [Required]
    public string ProductName { get; set; } = "";

    public string? Barcode { get; set; }

    public decimal SellingPrice { get; set; }

    public decimal CostPrice { get; set; }

  

    public int QuantityInStock { get; set; } = 0;

    //public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public IFormFile? Image {get; set; }
}