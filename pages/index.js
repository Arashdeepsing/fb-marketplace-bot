// pages/index.js
import { useState, useEffect } from "react";
import {
  ChakraProvider,
  Box,
  Heading,
  Input,
  Button,
  Textarea,
  VStack,
  HStack,
  Text,
  Spinner,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Image,
} from "@chakra-ui/react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [keywords, setKeywords] = useState("");
  const [exclude, setExclude] = useState("");
  const [radius, setRadius] = useState(50);
  const [message, setMessage] = useState("Hi! Is this still available?");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scrollPage, setScrollPage] = useState(1);
  const toast = useToast();

  const fetchMoreResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query,
        minPrice,
        maxPrice,
        minYear,
        maxYear,
        keywords,
        exclude,
        radius: String(radius),
        scrollCount: String(scrollPage),
      });

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setResults((prev) => [...prev, ...data]);
        setScrollPage((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load more.", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        !loading
      ) {
        fetchMoreResults();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, results]);

  const handleSearch = async () => {
    setScrollPage(1);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query,
        minPrice,
        maxPrice,
        minYear,
        maxYear,
        keywords,
        exclude,
        radius: String(radius),
        scrollCount: "1",
      });

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        toast({ title: data.error || "Search failed.", status: "error" });
        setResults([]);
        return;
      }

      setResults(Array.isArray(data) ? data : []);
      toast({ title: `Found ${data.length} listings.`, status: "success" });
    } catch (err) {
      console.error(err);
      toast({ title: "Search failed.", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleMessageAll = async () => {
    if (!results.length) {
      toast({
        title: "No listings to message.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listings: results,
          messageText: message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Messaging failed");
      }

      toast({
        title: `Messaged ${data.messaged} of ${data.total}.`,
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Messaging failed.", status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSingleMessage = async (listing) => {
    setLoading(true);
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listings: [listing],
          messageText: message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Message failed");
      }

      toast({
        title: `Message sent to ${listing.title}`,
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Message failed.", status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChakraProvider>
      <Box maxW="800px" mx="auto" p={6}>
        <Heading mb={4}>Python Scanner</Heading>
        <VStack spacing={4} align="stretch">
          <Input
            placeholder="Search Keywords"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <HStack>
            <Input
              placeholder="Min Price"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              placeholder="Max Price"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </HStack>

          <HStack>
            <Input
              placeholder="Min Year"
              type="number"
              value={minYear}
              onChange={(e) => setMinYear(e.target.value)}
            />
            <Input
              placeholder="Max Year"
              type="number"
              value={maxYear}
              onChange={(e) => setMaxYear(e.target.value)}
            />
          </HStack>

          <Textarea
            placeholder="Message to send"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <Button colorScheme="blue" onClick={handleSearch} isLoading={loading}>
            Search
          </Button>

          <Button
            colorScheme="green"
            onClick={handleMessageAll}
            isLoading={loading}
          >
            Message All
          </Button>

          {loading && <Spinner />}

          <Accordion allowToggle>
            {Array.isArray(results) &&
              results.map((item, i) => (
                <AccordionItem
                  key={i}
                  border="1px solid #e2e8f0"
                  borderRadius="md"
                >
                  {/* <AccordionButton>
                    <Box flex="1" textAlign="left">
                      {item.title} — ${item.price}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}> */}
                  <HStack align="start">
                    {item.image && (
                      <Image
                        boxSize="100px"
                        src={item.image}
                        alt={item.title}
                        mr={4}
                      />
                    )}
                    <Box>
                      <Text mb={2}>
                        <strong>Year:</strong> {item.year || "N/A"}
                      </Text>
                      <Text mb={2}>
                        <strong>Link:</strong>{" "}
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "blue.500",
                            textDecoration: "underline",
                          }}
                        >
                          View Listing
                        </a>
                      </Text>
                      <Text whiteSpace="pre-wrap">
                        <strong>Description:</strong> {item.description}
                      </Text>
                      <Button
                        mt={2}
                        colorScheme="purple"
                        size="sm"
                        onClick={() => handleSingleMessage(item)}
                      >
                        Message This Listing
                      </Button>
                    </Box>
                  </HStack>
                  {/* </AccordionPanel> */}
                </AccordionItem>
              ))}
          </Accordion>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

// // pages/index.js
// import { useState, useEffect, useRef } from "react";
// import {
//   ChakraProvider,
//   Box,
//   Heading,
//   Input,
//   Button,
//   Textarea,
//   VStack,
//   HStack,
//   Text,
//   Spinner,
//   useToast,
//   Image,
// } from "@chakra-ui/react";

// export default function Home() {
//   const [query, setQuery] = useState("");
//   const [minPrice, setMinPrice] = useState("");
//   const [maxPrice, setMaxPrice] = useState("");
//   const [minYear, setMinYear] = useState("");
//   const [maxYear, setMaxYear] = useState("");
//   const [keywords, setKeywords] = useState("");
//   const [exclude, setExclude] = useState("");
//   const [radius, setRadius] = useState(50);
//   const [message, setMessage] = useState("Hi! Is this still available?");
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const toast = useToast();
//   const sentinelRef = useRef();

//   const fetchListings = async (pageNumber = 1, append = false) => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         query,
//         minPrice,
//         maxPrice,
//         minYear,
//         maxYear,
//         keywords,
//         exclude,
//         radius: String(radius),
//         scrollCount: String(pageNumber * 5),
//       });

//       const res = await fetch(`/api/search?${params.toString()}`);
//       const data = await res.json();

//       if (!res.ok) {
//         toast({ title: data.error || "Search failed.", status: "error" });
//         return;
//       }

//       if (append) {
//         setResults((prev) => [...prev, ...data]);
//       } else {
//         setResults(data);
//       }
//     } catch (err) {
//       console.error(err);
//       toast({ title: "Search failed.", status: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = () => {
//     setPage(1);
//     fetchListings(1, false);
//   };

//   const handleMessageAll = async () => {
//     if (!results.length) {
//       toast({ title: "No listings to message.", status: "warning" });
//       return;
//     }
//     setLoading(true);
//     try {
//       const res = await fetch("/api/message", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ listings: results, messageText: message }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error);

//       toast({
//         title: `Messaged ${data.messaged} of ${data.total}.`,
//         status: "success",
//       });
//     } catch (err) {
//       console.error(err);
//       toast({ title: "Messaging failed.", status: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSingleMessage = async (listing) => {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/message", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ listings: [listing], messageText: message }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error);

//       toast({
//         title: `Message sent to ${listing.title}`,
//         status: "success",
//       });
//     } catch (err) {
//       console.error(err);
//       toast({ title: "Message failed.", status: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && !loading) {
//           const nextPage = page + 1;
//           setPage(nextPage);
//           fetchListings(nextPage, true);
//         }
//       },
//       { threshold: 1.0 }
//     );

//     const sentinel = sentinelRef.current;
//     if (sentinel) observer.observe(sentinel);
//     return () => observer.disconnect();
//   }, [page, loading]);

//   return (
//     <ChakraProvider>
//       <Box maxW="800px" mx="auto" p={6}>
//         <Heading mb={4}>Python Scanner</Heading>
//         <VStack spacing={4} align="stretch">
//           <Input
//             placeholder="Search Keywords"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />

//           <HStack>
//             <Input
//               placeholder="Min Price"
//               type="number"
//               value={minPrice}
//               onChange={(e) => setMinPrice(e.target.value)}
//             />
//             <Input
//               placeholder="Max Price"
//               type="number"
//               value={maxPrice}
//               onChange={(e) => setMaxPrice(e.target.value)}
//             />
//           </HStack>

//           <HStack>
//             <Input
//               placeholder="Min Year"
//               type="number"
//               value={minYear}
//               onChange={(e) => setMinYear(e.target.value)}
//             />
//             <Input
//               placeholder="Max Year"
//               type="number"
//               value={maxYear}
//               onChange={(e) => setMaxYear(e.target.value)}
//             />
//           </HStack>

//           <Textarea
//             placeholder="Message to send"
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//           />

//           <Button colorScheme="blue" onClick={handleSearch} isLoading={loading}>
//             Search
//           </Button>

//           <Button
//             colorScheme="green"
//             onClick={handleMessageAll}
//             isLoading={loading}
//           >
//             Message All
//           </Button>

//           {loading && <Spinner />}

//           {results.map((item, i) => (
//             <Box
//               key={i}
//               p={4}
//               border="1px solid #e2e8f0"
//               borderRadius="md"
//               mb={4}
//             >
//               <HStack align="start">
//                 {item.image && (
//                   <Image
//                     boxSize="100px"
//                     src={item.image}
//                     alt={item.title}
//                     mr={4}
//                   />
//                 )}
//                 <Box>
//                   <Text fontWeight="bold">{item.title}</Text>
//                   <Text>
//                     <strong>Price:</strong> ${item.price} —{" "}
//                     <strong>Year:</strong> {item.year || "N/A"}
//                   </Text>
//                   <Text>
//                     <strong>Link:</strong>{" "}
//                     <a
//                       href={item.link}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       style={{ color: "blue" }}
//                     >
//                       View Listing
//                     </a>
//                   </Text>
//                   <Text whiteSpace="pre-wrap">
//                     <strong>Description:</strong> {item.description}
//                   </Text>
//                   <Button
//                     mt={2}
//                     colorScheme="purple"
//                     size="sm"
//                     onClick={() => handleSingleMessage(item)}
//                   >
//                     Message This Listing
//                   </Button>
//                 </Box>
//               </HStack>
//             </Box>
//           ))}

//           <div ref={sentinelRef} style={{ height: "20px" }} />
//         </VStack>
//       </Box>
//     </ChakraProvider>
//   );
// }
